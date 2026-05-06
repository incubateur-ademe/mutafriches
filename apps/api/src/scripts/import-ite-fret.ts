/* eslint-disable no-console */
/**
 * Script d'import des Installations Terminales Embranchées (ITE) fret
 *
 * Usage (depuis apps/api):
 *   pnpm db:ite-fret:import
 *
 * Prérequis:
 *   - La migration doit avoir été exécutée
 *   - PostGIS doit être activé sur la base
 *   - Le fichier GeoJSON doit être présent dans src/scripts/data/base-ite-3000.geojson
 *
 * Comportement:
 *   - Lit le fichier GeoJSON local
 *   - Truncate la table raw_ite_fret avant import (full replace)
 *   - Insère par batch de 100 lignes
 *   - Crée l'index spatial PostGIS
 *   - Normalise l'état en "bon" ou "mauvais"
 *
 * Source: Cerema - Base ITE 3000
 * https://www.data.gouv.fr/datasets/base-de-donnees-des-installations-terminales-embranchees-fret-en-france-ite-3000
 */

import { readFileSync } from "fs";
import * as path from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as postgres from "postgres";

const GEOJSON_PATH = path.resolve(__dirname, "./data/base-ite-3000.geojson");
const BATCH_SIZE = 100;
const DATASET_NAME = "ite-fret";

interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  // Les noms de propriétés du dataset Cerema peuvent varier en casse/format ;
  // on accepte plusieurs variantes courantes ci-dessous (voir extractProp).
  properties: Record<string, unknown>;
}

interface GeoJSONCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

interface IteFretRow {
  nom: string;
  codeInsee: string | null;
  commune: string | null;
  departement: string | null;
  region: string | null;
  gestionnaire: string | null;
  etat: string | null;
  longitude: number;
  latitude: number;
}

interface ImportStats {
  totalFeatures: number;
  importedRows: number;
  errorRows: number;
  startTime: number;
}

/**
 * Récupère une propriété en testant plusieurs variantes de nom
 * (le dataset Cerema peut utiliser des casses différentes selon les versions).
 */
function extractProp(props: Record<string, unknown>, candidates: string[]): string | null {
  for (const key of candidates) {
    const value = props[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return null;
}

/**
 * Normalise l'état de l'ITE en "bon" ou "mauvais".
 *
 * Mapping basé sur les 8 libellés réels du dataset Cerema (Etat_ITE) :
 *   - "Bon", "Bon (...)", "Neuf", "Utilisée"  → "bon"  (ITE opérationnelle)
 *   - "Mauvais", "Mauvais (...)"               → "mauvais"
 *   - "Inutilisable", "Inutilisable (...)"     → "mauvais" (état dégradé,
 *                                                 même sémantique pour l'algo)
 */
function normaliserEtat(rawEtat: string | null): string | null {
  if (!rawEtat) return null;
  const lower = rawEtat.toLowerCase().trim();

  if (
    lower.includes("bon") ||
    lower.includes("neuf") ||
    lower.includes("utilisée") ||
    lower.includes("utilisee") ||
    lower.includes("operationnel") ||
    lower.includes("opérationnel")
  ) {
    return "bon";
  }
  if (
    lower.includes("mauvais") ||
    lower.includes("inutilisable") ||
    lower.includes("degrade") ||
    lower.includes("dégradé") ||
    lower.includes("hors service")
  ) {
    return "mauvais";
  }
  return null;
}

async function importIteFret(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Import ITE Fret en base de données");
  console.log("=".repeat(60));
  console.log(`Source: ${GEOJSON_PATH}`);
  console.log("-".repeat(60));

  console.log("\nLecture du fichier GeoJSON...");
  const fileContent = readFileSync(GEOJSON_PATH, "utf-8");
  const geojson = JSON.parse(fileContent) as GeoJSONCollection;
  console.log(`Fichier lu: ${geojson.features.length} features`);

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
    console.log("Connexion à PostgreSQL (Scalingo)");
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
    console.log(`Connexion à PostgreSQL (Local) sur ${host}:${port}`);
  }

  const client = postgres(dbConfig);
  const db = drizzle(client);

  const stats: ImportStats = {
    totalFeatures: geojson.features.length,
    importedRows: 0,
    errorRows: 0,
    startTime: Date.now(),
  };

  const logResult = await db.execute<{ id: number }>(sql`
    INSERT INTO raw_imports_log (dataset_name, source_path)
    VALUES (${DATASET_NAME}, ${GEOJSON_PATH})
    RETURNING id
  `);
  const logId = (logResult as unknown as Array<{ id: number }>)[0].id;
  console.log(`Log import créé: id=${logId}`);

  try {
    console.log("Vidage de la table raw_ite_fret...");
    await db.execute(sql`TRUNCATE TABLE raw_ite_fret RESTART IDENTITY`);

    console.log("Début de l'import...\n");

    const rows: IteFretRow[] = [];
    let skippedNoGeometry = 0;
    let skippedNoEtat = 0;

    for (const feature of geojson.features) {
      try {
        if (!feature.geometry || !feature.geometry.coordinates) {
          skippedNoGeometry++;
          stats.errorRows++;
          continue;
        }

        const [longitude, latitude] = feature.geometry.coordinates;
        const props = feature.properties;

        const rawEtat = extractProp(props, ["Etat_ITE", "etat_ite", "Etat", "etat"]);
        const etat = normaliserEtat(rawEtat);
        if (etat === null) {
          skippedNoEtat++;
        }

        // "Raison_sociale" est le nom de l'entreprise opérant l'ITE (ex: "Solvay Belle-Etoile")
        const nom = extractProp(props, [
          "Raison_sociale",
          "raison_sociale",
          "Nom_ITE",
          "nom_ite",
          "Nom",
          "nom",
        ]);

        rows.push({
          nom: nom || "Inconnu",
          codeInsee: extractProp(props, [
            "Code_INSEE",
            "code_insee",
            "INSEE_COM",
            "insee_com",
            "code_commune",
          ]),
          commune: extractProp(props, ["Commune", "commune", "nom_commune"]),
          departement: extractProp(props, ["Departement", "departement", "code_dep", "dep"]),
          region: extractProp(props, ["Region", "region", "nom_region"]),
          // Pas de gestionnaire dédié : on stocke la raison sociale ici aussi (cohérent)
          gestionnaire: extractProp(props, [
            "Gestionnaire",
            "gestionnaire",
            "Operateur",
            "operateur",
            "Exploitant",
            "exploitant",
            "Raison_sociale",
          ]),
          etat,
          longitude,
          latitude,
        });
      } catch (error) {
        console.error(`Erreur sur feature:`, error);
        stats.errorRows++;
      }
    }

    if (skippedNoGeometry > 0) {
      console.log(`\nFeatures ignorées (sans géométrie): ${skippedNoGeometry}`);
    }
    if (skippedNoEtat > 0) {
      console.log(`Features sans état reconnu (importées avec état NULL): ${skippedNoEtat}`);
    }

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      await insertBatch(db, batch);
      stats.importedRows += batch.length;

      process.stdout.write(
        `\rProgression: ${stats.importedRows}/${stats.totalFeatures} ITE importées`,
      );
    }

    process.stdout.write("\n");

    console.log("\nCréation de l'index spatial...");
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS raw_ite_fret_spatial_idx
      ON raw_ite_fret
      USING gist (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326))
    `);
    console.log("Index spatial créé/vérifié");

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
    console.log("TERMINÉ !");
    console.log("-".repeat(60));
    console.log(`ITE importées: ${stats.importedRows}`);
    console.log(`Erreurs: ${stats.errorRows}`);
    console.log(`Durée: ${elapsed.toFixed(1)}s`);

    const result = await db.execute<{ total: string; bon: string; mauvais: string }>(sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE etat = 'bon') as bon,
        COUNT(*) FILTER (WHERE etat = 'mauvais') as mauvais
      FROM raw_ite_fret
    `);

    console.log("\nStatistiques:");
    const finalStats = (
      result as unknown as Array<{ total: string; bon: string; mauvais: string }>
    )[0];
    console.log(`Total ITE: ${finalStats.total}`);
    console.log(`En bon état: ${finalStats.bon}`);
    console.log(`En mauvais état: ${finalStats.mauvais}`);
  } catch (error) {
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
    console.log("Connexion base de données fermée");
  }
}

async function insertBatch(db: ReturnType<typeof drizzle>, batch: IteFretRow[]): Promise<void> {
  if (batch.length === 0) return;

  const values = batch
    .map(
      (row) =>
        `(${escapeString(row.nom)}, ${escapeStringOrNull(row.codeInsee)}, ${escapeStringOrNull(row.commune)}, ${escapeStringOrNull(row.departement)}, ${escapeStringOrNull(row.region)}, ${escapeStringOrNull(row.gestionnaire)}, ${escapeStringOrNull(row.etat)}, ${row.longitude}, ${row.latitude})`,
    )
    .join(",\n");

  await db.execute(
    sql.raw(`
    INSERT INTO raw_ite_fret (nom, code_insee, commune, departement, region, gestionnaire, etat, longitude, latitude)
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

importIteFret().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("\nErreur:", message);
  process.exit(1);
});
