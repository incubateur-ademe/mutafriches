/* eslint-disable no-console */
/**
 * Script d'import du référentiel EPCI + communes en base de données
 *
 * Usage (depuis la racine du monorepo) :
 *   pnpm db:epci:import
 *
 * Source : data.gouv.fr — « Découpage administratif » (Etalab)
 *   https://www.data.gouv.fr/datasets/decoupage-administratif-1/
 *
 * Les ressources sont au format JSON, hébergées sur unpkg.com via le package
 * npm @etalab/decoupage-administratif. Le script télécharge directement les
 * fichiers epci.json et communes.json — pas de fichier à placer manuellement.
 *
 * Prérequis :
 *   - La migration 0017_quiet_bucky.sql doit avoir été exécutée.
 *   - Accès réseau sortant vers unpkg.com.
 *
 * Comportement :
 *   - Truncate communes puis epci (FK)
 *   - Insère les EPCI (batch 500), récupère le mapping commune -> EPCI via membres[]
 *   - Insère les communes de type "commune-actuelle" (batch 1000) avec leur epci_siren
 *   - Log la progression dans raw_imports_log
 *
 * Note : les arrondissements municipaux (Paris/Lyon/Marseille, codes 75101-75120,
 * 13201-13216, 69381-69389) ne sont pas inclus dans la table communes — seules
 * les communes-têtes (75056, 13055, 69123) le sont. Si les évaluations utilisent
 * des codes d'arrondissement, il faudra ajouter une normalisation.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as postgres from "postgres";

const ETALAB_VERSION = "5.3.0";
const EPCI_URL = `https://unpkg.com/@etalab/decoupage-administratif@${ETALAB_VERSION}/data/epci.json`;
const COMMUNES_URL = `https://unpkg.com/@etalab/decoupage-administratif@${ETALAB_VERSION}/data/communes.json`;

const BATCH_SIZE_EPCI = 500;
const BATCH_SIZE_COMMUNES = 1000;
const DATASET_NAME = `decoupage-administratif-etalab-${ETALAB_VERSION}`;

interface EtalabEpciMembre {
  code: string;
  siren: string;
  nom?: string;
}

interface EtalabEpci {
  code: string;
  nom: string;
  type?: string;
  modeFinancement?: string;
  populationTotale?: number;
  populationMunicipale?: number;
  membres: EtalabEpciMembre[];
}

interface EtalabCommune {
  code: string;
  nom: string;
  type: string;
  zone?: string;
  departement?: string;
  region?: string;
  siren?: string;
  population?: number;
}

interface EpciRow {
  siren: string;
  nom: string;
  type: string | null;
  departementSiege: string | null;
  nbCommunes: number;
  population: number | null;
}

interface CommuneRow {
  codeInsee: string;
  nom: string;
  departement: string | null;
  epciSiren: string | null;
}

interface ImportStats {
  importedEpci: number;
  importedCommunes: number;
  startTime: number;
}

async function fetchJson<T>(url: string): Promise<T> {
  console.log(`Telechargement: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} sur ${url}`);
  }
  return (await response.json()) as T;
}

async function importEpciCommunes(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Import EPCI + communes (source : data.gouv.fr / Etalab)");
  console.log("=".repeat(60));

  let dbConfig: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl?: { rejectUnauthorized: boolean };
  };

  if (process.env.SCALINGO_POSTGRESQL_URL) {
    const url = new URL(process.env.SCALINGO_POSTGRESQL_URL);
    dbConfig = {
      host: url.hostname,
      port: parseInt(url.port),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
    };
    console.log("Connexion a PostgreSQL (Scalingo)");
  } else {
    const host = process.env.DB_HOST || "localhost";
    const port = process.env.DB_PORT || "5432";
    dbConfig = {
      host,
      port: parseInt(port),
      user: process.env.DB_USER || "mutafriches_user",
      password: process.env.DB_PASSWORD || "mutafriches_password",
      database: process.env.DB_NAME || "mutafriches",
    };
    console.log(`Connexion a PostgreSQL (Local) sur ${host}:${port}`);
  }

  const client = postgres(dbConfig);
  const db = drizzle(client);

  const logResult = await db.execute<{ id: number }>(sql`
    INSERT INTO raw_imports_log (dataset_name, source_path)
    VALUES (${DATASET_NAME}, ${EPCI_URL})
    RETURNING id
  `);
  const logId = (logResult as unknown as Array<{ id: number }>)[0].id;
  console.log(`Log import cree: id=${logId}`);

  const stats: ImportStats = {
    importedEpci: 0,
    importedCommunes: 0,
    startTime: Date.now(),
  };

  try {
    // 1. Telechargement des deux fichiers JSON
    const [epciData, communesData] = await Promise.all([
      fetchJson<EtalabEpci[]>(EPCI_URL),
      fetchJson<EtalabCommune[]>(COMMUNES_URL),
    ]);
    console.log(`EPCI recus: ${epciData.length}`);
    console.log(`Communes recues (tous types): ${communesData.length}`);

    // 2. Construction du mapping codeInsee -> sirenEpci depuis les membres
    const communeToEpci = new Map<string, string>();
    const epciRows: EpciRow[] = epciData.map((e) => {
      for (const membre of e.membres) {
        communeToEpci.set(membre.code, e.code);
      }
      return {
        siren: e.code,
        nom: e.nom,
        type: e.type ?? null,
        departementSiege: e.membres[0]?.code != null ? extractDepartement(e.membres[0].code) : null,
        nbCommunes: e.membres.length,
        population: e.populationTotale ?? null,
      };
    });

    // 3. Filtrage des communes : on ne garde que les communes-actuelles
    //    (exclut arrondissements municipaux, communes associees/deleguees)
    const communeRows: CommuneRow[] = communesData
      .filter((c) => c.type === "commune-actuelle")
      .map((c) => ({
        codeInsee: c.code,
        nom: c.nom,
        departement: c.departement ?? extractDepartement(c.code),
        epciSiren: communeToEpci.get(c.code) ?? null,
      }));

    console.log(`EPCI a inserer: ${epciRows.length}`);
    console.log(`Communes-actuelles a inserer: ${communeRows.length}`);

    // 4. Vidage dans le bon ordre (FK : communes -> epci)
    console.log("-".repeat(60));
    console.log("Vidage des tables communes et epci...");
    await db.execute(sql`TRUNCATE TABLE communes CASCADE`);
    await db.execute(sql`TRUNCATE TABLE epci CASCADE`);

    // 5. Insertion des EPCI
    console.log("Insertion des EPCI...");
    for (let i = 0; i < epciRows.length; i += BATCH_SIZE_EPCI) {
      const batch = epciRows.slice(i, i + BATCH_SIZE_EPCI);
      await insertEpciBatch(db, batch);
      stats.importedEpci += batch.length;
    }
    console.log(`EPCI inseres: ${stats.importedEpci}`);

    // 6. Insertion des communes
    console.log("Insertion des communes...");
    for (let i = 0; i < communeRows.length; i += BATCH_SIZE_COMMUNES) {
      const batch = communeRows.slice(i, i + BATCH_SIZE_COMMUNES);
      await insertCommunesBatch(db, batch);
      stats.importedCommunes += batch.length;
    }
    console.log(`Communes inserees: ${stats.importedCommunes}`);

    const elapsed = (Date.now() - stats.startTime) / 1000;
    const totalImported = stats.importedEpci + stats.importedCommunes;
    await db.execute(sql`
      UPDATE raw_imports_log
      SET finished_at = NOW(),
          status = 'success',
          rows_imported = ${totalImported},
          rows_total = ${totalImported}
      WHERE id = ${logId}
    `);

    console.log("-".repeat(60));
    console.log("TERMINE !");
    console.log("-".repeat(60));
    console.log(`EPCI importes: ${stats.importedEpci.toLocaleString()}`);
    console.log(`Communes importees: ${stats.importedCommunes.toLocaleString()}`);
    console.log(`Duree: ${elapsed.toFixed(1)}s`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await db.execute(sql`
      UPDATE raw_imports_log
      SET finished_at = NOW(),
          status = 'failed',
          rows_imported = ${stats.importedEpci + stats.importedCommunes},
          error_message = ${errorMessage}
      WHERE id = ${logId}
    `);
    throw error;
  } finally {
    await client.end();
    console.log("Connexion base de donnees fermee");
  }
}

/**
 * Extrait le code département depuis un code INSEE de commune (5 caractères)
 * Gère la Corse (2A, 2B) et les DOM-TOM (97x, 98x)
 */
function extractDepartement(codeInsee: string): string {
  if (codeInsee.startsWith("97") || codeInsee.startsWith("98")) {
    return codeInsee.substring(0, 3);
  }
  return codeInsee.substring(0, 2);
}

async function insertEpciBatch(db: ReturnType<typeof drizzle>, batch: EpciRow[]): Promise<void> {
  if (batch.length === 0) return;

  const values = batch
    .map(
      (row) =>
        `(${escapeString(row.siren)}, ${escapeString(row.nom)}, ` +
        `${escapeStringOrNull(row.type)}, ${escapeStringOrNull(row.departementSiege)}, ` +
        `${row.nbCommunes}, ${row.population ?? "NULL"})`,
    )
    .join(",\n");

  await db.execute(
    sql.raw(`
    INSERT INTO epci (siren, nom, nature_juridique, departement_siege, nb_communes, population)
    VALUES ${values}
    ON CONFLICT (siren) DO NOTHING
  `),
  );
}

async function insertCommunesBatch(
  db: ReturnType<typeof drizzle>,
  batch: CommuneRow[],
): Promise<void> {
  if (batch.length === 0) return;

  const values = batch
    .map(
      (row) =>
        `(${escapeString(row.codeInsee)}, ${escapeString(row.nom)}, ` +
        `${escapeStringOrNull(row.departement)}, ${escapeStringOrNull(row.epciSiren)})`,
    )
    .join(",\n");

  await db.execute(
    sql.raw(`
    INSERT INTO communes (code_insee, nom, departement, epci_siren)
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

importEpciCommunes().catch((error: unknown) => {
  console.error("Erreur:", error);
  process.exit(1);
});
