/* eslint-disable no-console */
/**
 * Script d'import du référentiel Zonage ABC (tension du marché du logement) en base.
 *
 * Usage (depuis la racine du monorepo) :
 *   pnpm db:zonage-abc:import
 *
 * Source : data.gouv.fr — « Liste des communes selon le zonage ABC » (DGALN)
 *   https://www.data.gouv.fr/datasets/liste-des-communes-selon-le-zonage-abc
 *
 * L'URL stable ci-dessous redirige toujours vers le dernier CSV publié — pas de
 * fichier à placer manuellement. À rejouer à chaque nouvel arrêté (~1×/an).
 *
 * Prérequis :
 *   - La migration 0030_raw_zonage_abc.sql doit avoir été exécutée.
 *   - Accès réseau sortant vers data.gouv.fr.
 *
 * Comportement :
 *   - Télécharge le CSV (UTF-8, séparateur ";")
 *   - Détecte dynamiquement la colonne de zonage : son nom porte le millésime et change
 *     à chaque arrêté (« Zonage en vigueur depuis le 5 septembre 2025 », puis
 *     « Zonage ABC en vigueur depuis le 26 juin 2026 »…)
 *   - Normalise les zones vers les valeurs de l'enum (abis | a | b1 | b2 | c)
 *   - Valide l'intégralité du fichier AVANT de vider la table (un CSV tronqué ou au
 *     schéma inattendu ne doit jamais écraser un référentiel valide)
 *   - Truncate raw_zonage_abc puis insère par batch (idempotent)
 *   - Log la progression dans raw_imports_log
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { ZonageAbcLogement } from "@mutafriches/shared-types";
import { getAppConfig } from "../config";

const ZONAGE_ABC_URL =
  "https://www.data.gouv.fr/fr/datasets/r/13f7282b-8a25-43ab-9713-8bb4e476df55";
const BATCH_SIZE = 1000;
const SEPARATOR = ";";

/** Motif de la colonne portant la zone : son nom change à chaque arrêté. */
const MOTIF_COLONNE_ZONAGE = /zonage.*en\s+vigueur/i;

/**
 * Plancher de sécurité : la France compte ~34 900 communes. En dessous, le fichier est
 * tronqué ou le schéma a changé — on refuse d'écraser le référentiel existant.
 */
const MIN_COMMUNES_ATTENDUES = 30000;

interface ZonageAbcRow {
  codeInsee: string;
  nom: string | null;
  departement: string | null;
  zonage: ZonageAbcLogement;
}

interface ImportStats {
  imported: number;
  filtered: number;
  total: number;
  startTime: number;
}

/**
 * Normalise une zone brute vers l'enum. Le dataset écrit "Abis" (sans espace),
 * on tolère les variantes "A bis", "a-bis", etc.
 */
function normaliserZonage(valeur: string | undefined): ZonageAbcLogement | null {
  if (!valeur) return null;

  const normalise = valeur
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "");

  switch (normalise) {
    case "abis":
      return ZonageAbcLogement.ABIS;
    case "a":
      return ZonageAbcLogement.A;
    case "b1":
      return ZonageAbcLogement.B1;
    case "b2":
      return ZonageAbcLogement.B2;
    case "c":
      return ZonageAbcLogement.C;
    default:
      return null;
  }
}

/**
 * Extrait le millésime du nom de colonne
 * (« Zonage ABC en vigueur depuis le 26 juin 2026 » -> « 26 juin 2026 »).
 */
function extraireMillesime(nomColonne: string): string {
  const match = /depuis le\s+(.+)$/i.exec(nomColonne.trim());
  return (match ? match[1] : nomColonne).trim().slice(0, 100);
}

async function importZonageAbc(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Import Zonage ABC (source : data.gouv.fr / DGALN)");
  console.log("=".repeat(60));

  const dbConfig = getAppConfig().database;
  const client = postgres(dbConfig);
  const db = drizzle(client);

  const stats: ImportStats = { imported: 0, filtered: 0, total: 0, startTime: Date.now() };

  // 1. Telechargement
  console.log(`Telechargement: ${ZONAGE_ABC_URL}`);
  const response = await fetch(ZONAGE_ABC_URL);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} sur ${ZONAGE_ABC_URL}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const lines = buffer
    .toString("utf-8")
    .split(/\r?\n/)
    .filter((l) => l.length > 0);
  console.log(`Lignes recues: ${lines.length} (${(buffer.length / 1_000).toFixed(0)} Ko)`);

  if (lines.length < 2) {
    throw new Error("CSV Zonage ABC vide ou illisible");
  }

  // 2. Detection dynamique de la colonne de zonage (son nom porte le millesime)
  const header = lines[0].split(SEPARATOR).map((c) => c.trim());
  const codeCol = header.indexOf("CODGEO");
  const nomCol = header.indexOf("LIBGEO");
  const depCol = header.indexOf("DEP");
  const zonageCol = header.findIndex((c) => MOTIF_COLONNE_ZONAGE.test(c));

  if (codeCol < 0 || zonageCol < 0) {
    throw new Error(
      `Schema inattendu : colonne CODGEO ou zonage introuvable. Entete recue: ${header.join(", ")}`,
    );
  }

  const millesime = extraireMillesime(header[zonageCol]);
  const datasetName = `zonage-abc-communes-${millesime}`;
  console.log(`Colonne de zonage: "${header[zonageCol]}" -> millesime "${millesime}"`);

  // 3. Parsing et validation AVANT toute ecriture
  const rows: ZonageAbcRow[] = [];
  const valeursInconnues = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    stats.total++;
    const fields = lines[i].split(SEPARATOR);
    const codeInsee = fields[codeCol]?.trim();
    const zonage = normaliserZonage(fields[zonageCol]);

    if (!codeInsee || !zonage) {
      if (codeInsee && !zonage) valeursInconnues.add(fields[zonageCol]?.trim() ?? "");
      stats.filtered++;
      continue;
    }

    rows.push({
      codeInsee,
      nom: nomCol >= 0 ? (fields[nomCol]?.trim() ?? null) : null,
      departement: depCol >= 0 ? (fields[depCol]?.trim() ?? null) : null,
      zonage,
    });
  }

  if (valeursInconnues.size > 0) {
    console.warn(`Valeurs de zonage non reconnues: ${[...valeursInconnues].join(", ")}`);
  }

  if (rows.length < MIN_COMMUNES_ATTENDUES) {
    throw new Error(
      `Seulement ${rows.length} communes exploitables (< ${MIN_COMMUNES_ATTENDUES} attendues) : ` +
        `fichier tronque ou schema modifie. Import annule, la table existante est preservee.`,
    );
  }
  console.log(`Communes a inserer: ${rows.length} (${stats.filtered} ligne(s) ignoree(s))`);

  const logResult = await db.execute<{ id: number }>(sql`
    INSERT INTO raw_imports_log (dataset_name, source_path, file_size_bytes)
    VALUES (${datasetName}, ${ZONAGE_ABC_URL}, ${buffer.length})
    RETURNING id
  `);
  const logId = (logResult as unknown as Array<{ id: number }>)[0].id;
  console.log(`Log import cree: id=${logId}`);

  try {
    // 4. Vidage puis insertion par batch
    console.log("Vidage de la table raw_zonage_abc...");
    await db.execute(sql`TRUNCATE TABLE raw_zonage_abc`);

    console.log("Insertion des communes...");
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      await insertBatch(db, batch, millesime);
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
    console.log(`Millesime en base: ${millesime}`);
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

async function insertBatch(
  db: ReturnType<typeof drizzle>,
  batch: ZonageAbcRow[],
  millesime: string,
): Promise<void> {
  if (batch.length === 0) return;

  const values = batch
    .map(
      (row) =>
        `(${escapeString(row.codeInsee)}, ${escapeStringOrNull(row.nom)}, ` +
        `${escapeStringOrNull(row.departement)}, ${escapeString(row.zonage)}, ` +
        `${escapeString(millesime)})`,
    )
    .join(",\n");

  await db.execute(
    sql.raw(`
    INSERT INTO raw_zonage_abc (code_insee, nom, departement, zonage, millesime)
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

importZonageAbc().catch((error: unknown) => {
  console.error("Erreur:", error);
  process.exit(1);
});
