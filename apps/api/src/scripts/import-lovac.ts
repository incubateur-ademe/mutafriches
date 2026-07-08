/* eslint-disable no-console */
/**
 * Script d'import du référentiel LOVAC (logements vacants du parc privé) en base.
 *
 * Usage (depuis la racine du monorepo) :
 *   pnpm db:lovac:import
 *
 * Source : data.gouv.fr — « Logements vacants du parc privé par commune » (Cerema)
 *   https://www.data.gouv.fr/datasets/logements-vacants-du-parc-prive-en-france-et-par-commune-departement-region/
 *
 * L'URL stable ci-dessous redirige toujours vers le dernier CSV publié — pas de
 * fichier à placer manuellement.
 *
 * Prérequis :
 *   - La migration 0029_famous_blur.sql doit avoir été exécutée.
 *   - Accès réseau sortant vers data.gouv.fr.
 *
 * Comportement :
 *   - Télécharge le CSV (encodage Latin-1, séparateur ";", champs entre guillemets)
 *   - Détecte dynamiquement les colonnes de millésime (le schéma du dataset change
 *     chaque année : CODGEO_25 -> CODGEO_26, pp_total_* -> ff_pp_total_*, etc.)
 *   - Retient le millésime le plus récent disponible pour le total et pour les vacants
 *   - Traite "s" (secrétisé) et valeurs vides comme NULL
 *   - Truncate raw_lovac puis insère par batch (idempotent)
 *   - Log la progression dans raw_imports_log
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { getAppConfig } from "../config";
import { sql } from "drizzle-orm";
import postgres from "postgres";

const LOVAC_URL = "https://www.data.gouv.fr/fr/datasets/r/2e0417b4-902d-4c60-90e7-bf5df148cb87";
const BATCH_SIZE = 1000;
const SEPARATOR = ";";

interface LovacRow {
  codeInsee: string;
  nom: string | null;
  nombreLogementsTotal: number | null;
  nombreLogementsVacants: number | null;
  nombreLogementsVacantsPlus2ans: number | null;
  millesime: number;
}

interface ImportStats {
  imported: number;
  filtered: number;
  total: number;
  startTime: number;
}

/**
 * Parse une ligne CSV avec champs optionnellement entre guillemets ("" = quote échappée).
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === SEPARATOR) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

interface YearColumn {
  index: number;
  year: number;
}

/**
 * Collecte les colonnes de millésime correspondant au motif, triées par année décroissante.
 * Le motif capture l'année sur 2 chiffres (ex: /^(?:ff_)?pp_total_(\d{2})$/).
 * Permet, par commune, de retenir la valeur la plus récente réellement disponible
 * (les petites communes ont un parc privé secrétisé sur les millésimes récents).
 */
function collectYearColumns(header: string[], pattern: RegExp): YearColumn[] {
  const cols: YearColumn[] = [];
  header.forEach((col, index) => {
    const match = pattern.exec(col.trim());
    if (match) {
      cols.push({ index, year: 2000 + parseInt(match[1], 10) });
    }
  });
  return cols.sort((a, b) => b.year - a.year);
}

/**
 * Convertit une valeur brute LOVAC en nombre.
 * "s" (secrétisé), vide ou non numérique => null.
 */
function parseLovacNumber(value: string | undefined): number | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  if (trimmed === "" || trimmed.toLowerCase() === "s") return null;
  const parsed = parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Retourne la valeur non-null la plus récente et son année, en parcourant les
 * colonnes de la plus récente à la plus ancienne.
 */
function firstNonNull(
  fields: string[],
  cols: YearColumn[],
): { value: number | null; year: number | null } {
  for (const col of cols) {
    const value = parseLovacNumber(fields[col.index]);
    if (value !== null) return { value, year: col.year };
  }
  return { value: null, year: null };
}

async function importLovac(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Import LOVAC (source : data.gouv.fr / Cerema)");
  console.log("=".repeat(60));

  const dbConfig = getAppConfig().database;
  const client = postgres(dbConfig);
  const db = drizzle(client);

  const stats: ImportStats = { imported: 0, filtered: 0, total: 0, startTime: Date.now() };

  // 1. Telechargement + decodage Latin-1
  console.log(`Telechargement: ${LOVAC_URL}`);
  const response = await fetch(LOVAC_URL);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} sur ${LOVAC_URL}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const content = buffer.toString("latin1");
  const lines = content.split(/\r?\n/).filter((l) => l.length > 0);
  console.log(`Lignes recues: ${lines.length} (${(buffer.length / 1_000_000).toFixed(1)} Mo)`);

  if (lines.length < 2) {
    throw new Error("CSV LOVAC vide ou illisible");
  }

  // 2. Detection dynamique des colonnes (le schema change selon le millesime)
  const header = parseCsvLine(lines[0]);
  const codeCol = findFirstColumn(header, /^CODGEO_\d{2}$/) ?? 0;
  const nomCol = findFirstColumn(header, /^LIBGEO_\d{2}$/);
  const totalCols = collectYearColumns(header, /^(?:ff_)?pp_total_(\d{2})$/);
  const vacantCols = collectYearColumns(header, /^pp_vacant_(\d{2})$/);
  const vacantPlus2ansCols = collectYearColumns(header, /^pp_vacant_plus_2ans_(\d{2})$/);

  if (totalCols.length === 0 || vacantCols.length === 0) {
    throw new Error(
      `Colonnes de millesime introuvables dans l'entete: ${header.join(", ").slice(0, 200)}`,
    );
  }

  // Millesime de reference (dernier disponible pour les vacants) pour le nom du dataset
  const millesimeReference = vacantCols[0].year;
  const datasetName = `lovac-communes-${millesimeReference}`;
  console.log(
    `Millesimes disponibles -> total: ${totalCols[totalCols.length - 1].year}-${totalCols[0].year}, ` +
      `vacants: ${vacantCols[vacantCols.length - 1].year}-${vacantCols[0].year} ` +
      `(valeur la plus recente retenue par commune)`,
  );

  const logResult = await db.execute<{ id: number }>(sql`
    INSERT INTO raw_imports_log (dataset_name, source_path, file_size_bytes)
    VALUES (${datasetName}, ${LOVAC_URL}, ${buffer.length})
    RETURNING id
  `);
  const logId = (logResult as unknown as Array<{ id: number }>)[0].id;
  console.log(`Log import cree: id=${logId}`);

  try {
    // 3. Parsing des lignes
    const rows: LovacRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      stats.total++;
      const fields = parseCsvLine(lines[i]);
      const codeInsee = fields[codeCol]?.trim();
      if (!codeInsee) {
        stats.filtered++;
        continue;
      }
      // Par commune : valeur la plus recente non-secretisee pour chaque metrique
      const total = firstNonNull(fields, totalCols);
      const vacants = firstNonNull(fields, vacantCols);
      const vacantsPlus2ans = firstNonNull(fields, vacantPlus2ansCols);
      rows.push({
        codeInsee,
        nom: nomCol !== null ? (fields[nomCol]?.trim() ?? null) : null,
        nombreLogementsTotal: total.value,
        nombreLogementsVacants: vacants.value,
        nombreLogementsVacantsPlus2ans: vacantsPlus2ans.value,
        millesime: vacants.year ?? millesimeReference,
      });
    }
    console.log(`Communes a inserer: ${rows.length}`);

    // 4. Vidage puis insertion par batch
    console.log("Vidage de la table raw_lovac...");
    await db.execute(sql`TRUNCATE TABLE raw_lovac`);

    console.log("Insertion des communes...");
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      await insertBatch(db, batch);
      stats.imported += batch.length;
    }

    const elapsed = (Date.now() - stats.startTime) / 1000;
    await db.execute(sql`
      UPDATE raw_imports_log
      SET finished_at = NOW(),
          status = 'success',
          rows_imported = ${stats.imported},
          rows_filtered = ${stats.filtered},
          rows_total = ${stats.total}
      WHERE id = ${logId}
    `);

    console.log("-".repeat(60));
    console.log("TERMINE !");
    console.log("-".repeat(60));
    console.log(`Communes importees: ${stats.imported.toLocaleString()}`);
    console.log(`Lignes ignorees (sans code INSEE): ${stats.filtered}`);
    console.log(`Duree: ${elapsed.toFixed(1)}s`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await db.execute(sql`
      UPDATE raw_imports_log
      SET finished_at = NOW(),
          status = 'failed',
          rows_imported = ${stats.imported},
          error_message = ${errorMessage}
      WHERE id = ${logId}
    `);
    throw error;
  } finally {
    await client.end();
    console.log("Connexion base de donnees fermee");
  }
}

function findFirstColumn(header: string[], pattern: RegExp): number | null {
  const index = header.findIndex((col) => pattern.test(col.trim()));
  return index >= 0 ? index : null;
}

async function insertBatch(db: ReturnType<typeof drizzle>, batch: LovacRow[]): Promise<void> {
  if (batch.length === 0) return;

  const values = batch
    .map(
      (row) =>
        `(${escapeString(row.codeInsee)}, ${escapeStringOrNull(row.nom)}, ` +
        `${row.nombreLogementsTotal ?? "NULL"}, ${row.nombreLogementsVacants ?? "NULL"}, ` +
        `${row.nombreLogementsVacantsPlus2ans ?? "NULL"}, ${row.millesime})`,
    )
    .join(",\n");

  await db.execute(
    sql.raw(`
    INSERT INTO raw_lovac (code_insee, nom, nombre_logements_total, nombre_logements_vacants, nombre_logements_vacants_plus_2ans, millesime)
    VALUES ${values}
    ON CONFLICT (code_insee) DO NOTHING
  `),
  );
}

function escapeString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function escapeStringOrNull(value: string | null): string {
  return value ? escapeString(value) : "NULL";
}

importLovac().catch((error: unknown) => {
  console.error("Erreur:", error);
  process.exit(1);
});
