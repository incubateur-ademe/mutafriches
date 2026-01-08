/* eslint-disable no-console */
/**
 * Script d'import des sites pollues ADEME
 *
 * Usage (depuis apps/api):
 *   pnpm db:ademe-sites:import
 *
 * Prerequis:
 *   - La migration doit avoir ete executee
 *   - PostGIS doit etre active sur la base
 *   - Le fichier GeoJSON doit etre present dans data/donnees-ademe-sites-pollues.geojson
 *
 * Comportement:
 *   - Lit le fichier GeoJSON local
 *   - Truncate la table raw_ademe_sites_pollues avant import (full replace)
 *   - Insere par batch de 100 lignes
 *   - Cree l'index spatial PostGIS
 *
 * Source: ADEME - Sites et Sols Pollues (Interventions de l'ADEME)
 */

import { readFileSync } from "fs";
import * as path from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as postgres from "postgres";

// Configuration
const GEOJSON_PATH = path.resolve(__dirname, "../../data/donnees-ademe-sites-pollues.geojson");
const BATCH_SIZE = 100;
const DATASET_NAME = "ademe-sites-pollues";

interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    Nom_site: string;
    Code_INSEE: string;
    Commune?: string;
    Numeros_parcelles_cadastrales?: string[];
    Surface_site_m2?: string;
    Typologie_intervention_ADEME?: string;
    Etat_operation?: string;
    Region?: string;
    Departement?: string;
  };
}

interface GeoJSONCollection {
  type: "FeatureCollection";
  total: number;
  features: GeoJSONFeature[];
}

interface AdemeSiteRow {
  nomSite: string;
  codeInsee: string;
  commune: string | null;
  parcellesCadastrales: string | null;
  longitude: number;
  latitude: number;
  surfaceSiteM2: string | null;
  typologieIntervention: string | null;
  etatOperation: string | null;
  region: string | null;
  departement: string | null;
}

interface ImportStats {
  totalFeatures: number;
  importedRows: number;
  errorRows: number;
  startTime: number;
}

async function importAdemeSites(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Import Sites Pollues ADEME en base de donnees");
  console.log("=".repeat(60));
  console.log(`Source: ${GEOJSON_PATH}`);
  console.log("-".repeat(60));

  // Lire le fichier GeoJSON
  console.log("\nLecture du fichier GeoJSON...");
  const fileContent = readFileSync(GEOJSON_PATH, "utf-8");
  const geojson = JSON.parse(fileContent) as GeoJSONCollection;
  console.log(`Fichier lu: ${geojson.features.length} features`);

  // Connexion a la base
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

  const stats: ImportStats = {
    totalFeatures: geojson.features.length,
    importedRows: 0,
    errorRows: 0,
    startTime: Date.now(),
  };

  // Creer l'entree de log
  const logResult = await db.execute<{ id: number }>(sql`
    INSERT INTO raw_imports_log (dataset_name, source_path)
    VALUES (${DATASET_NAME}, ${GEOJSON_PATH})
    RETURNING id
  `);
  const logId = (logResult as unknown as Array<{ id: number }>)[0].id;
  console.log(`Log import cree: id=${logId}`);

  try {
    // Truncate la table existante
    console.log("Vidage de la table raw_ademe_sites_pollues...");
    await db.execute(sql`TRUNCATE TABLE raw_ademe_sites_pollues RESTART IDENTITY`);

    // Parser et importer les features
    console.log("Debut de l import...\n");

    const rows: AdemeSiteRow[] = [];

    for (const feature of geojson.features) {
      try {
        const props = feature.properties;
        const [longitude, latitude] = feature.geometry.coordinates;

        // Convertir le tableau de parcelles en string JSON
        const parcelles = props.Numeros_parcelles_cadastrales;
        const parcellesStr = parcelles && parcelles.length > 0 ? JSON.stringify(parcelles) : null;

        rows.push({
          nomSite: props.Nom_site || "Inconnu",
          codeInsee: props.Code_INSEE || "",
          commune: props.Commune || null,
          parcellesCadastrales: parcellesStr,
          longitude,
          latitude,
          surfaceSiteM2: props.Surface_site_m2 || null,
          typologieIntervention: props.Typologie_intervention_ADEME || null,
          etatOperation: props.Etat_operation || null,
          region: props.Region || null,
          departement: props.Departement || null,
        });
      } catch (error) {
        console.error(`Erreur sur feature:`, error);
        stats.errorRows++;
      }
    }

    // Inserer par batch
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      await insertBatch(db, batch);
      stats.importedRows += batch.length;

      // Afficher la progression
      process.stdout.write(
        `\rProgression: ${stats.importedRows}/${stats.totalFeatures} sites importes`,
      );
    }

    process.stdout.write("\n");

    // Creer l'index spatial s'il n'existe pas deja
    console.log("\nCreation de l index spatial...");
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS raw_ademe_sites_pollues_spatial_idx
      ON raw_ademe_sites_pollues
      USING gist (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326))
    `);
    console.log("Index spatial cree/verifie");

    // Mettre a jour le log
    const elapsed = (Date.now() - stats.startTime) / 1000;
    await db.execute(sql`
      UPDATE raw_imports_log
      SET finished_at = NOW(),
          status = 'success',
          rows_imported = ${stats.importedRows},
          rows_total = ${stats.totalFeatures}
      WHERE id = ${logId}
    `);

    console.log("-".repeat(60));
    console.log("TERMINE !");
    console.log("-".repeat(60));
    console.log(`Sites importes: ${stats.importedRows}`);
    console.log(`Erreurs: ${stats.errorRows}`);
    console.log(`Duree: ${elapsed.toFixed(1)}s`);

    // Statistiques finales
    const result = await db.execute<{ total: string; regions: string }>(sql`
      SELECT
        COUNT(*) as total,
        COUNT(DISTINCT region) as regions
      FROM raw_ademe_sites_pollues
    `);

    console.log("\nStatistiques:");
    const finalStats = (result as unknown as Array<{ total: string; regions: string }>)[0];
    console.log(`Total sites: ${finalStats.total}`);
    console.log(`Regions differentes: ${finalStats.regions}`);
  } catch (error) {
    // Logger l'erreur
    const errorMessage = error instanceof Error ? error.message : String(error);
    await db.execute(sql`
      UPDATE raw_imports_log
      SET finished_at = NOW(),
          status = 'failed',
          rows_imported = ${stats.importedRows},
          rows_total = ${stats.totalFeatures},
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
  batch: AdemeSiteRow[],
): Promise<void> {
  if (batch.length === 0) return;

  const values = batch
    .map(
      (row) =>
        `(${escapeString(row.nomSite)}, ${escapeString(row.codeInsee)}, ${escapeStringOrNull(row.commune)}, ${escapeStringOrNull(row.parcellesCadastrales)}, ${row.longitude}, ${row.latitude}, ${escapeStringOrNull(row.surfaceSiteM2)}, ${escapeStringOrNull(row.typologieIntervention)}, ${escapeStringOrNull(row.etatOperation)}, ${escapeStringOrNull(row.region)}, ${escapeStringOrNull(row.departement)})`,
    )
    .join(",\n");

  await db.execute(
    sql.raw(`
    INSERT INTO raw_ademe_sites_pollues (nom_site, code_insee, commune, parcelles_cadastrales, longitude, latitude, surface_site_m2, typologie_intervention, etat_operation, region, departement)
    VALUES ${values}
  `),
  );
}

function escapeString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function escapeStringOrNull(value: string | null): string {
  if (value === null) return "NULL";
  return escapeString(value);
}

// Execution
importAdemeSites().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("\nErreur:", message);
  process.exit(1);
});
