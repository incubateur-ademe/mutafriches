/* eslint-disable no-console, @typescript-eslint/no-non-null-assertion */
/**
 * Script d'import du CSV BPE filtré en base de données
 *
 * Usage (depuis apps/api):
 *   pnpm db:bpe:import
 *
 * Prérequis:
 *   - Le fichier apps/api/data/bpe-filtered.csv doit exister
 *   - La migration 0007_premium_malice.sql doit avoir été exécutée
 *   - PostGIS doit être activé sur la base
 *
 * Comportement:
 *   - Truncate la table raw_bpe avant import (full replace)
 *   - Insère par batch de 1000 lignes
 *   - Log la progression dans raw_imports_log
 */

import { createReadStream, statSync } from "fs";
import { createInterface } from "readline";
import * as path from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as postgres from "postgres";

// Configuration
const SEPARATOR = ";";
const BATCH_SIZE = 1000;
const DATASET_NAME = "bpe";

interface ImportStats {
  totalLines: number;
  importedLines: number;
  errorLines: number;
  startTime: number;
}

interface BpeRow {
  codeEquipement: string;
  codeCommune: string;
  longitude: string;
  latitude: string;
  qualiteXy: string | null;
  anneeSource: number;
}

async function importBpe(): Promise<void> {
  const dataDir = path.resolve(__dirname, "../../data");
  const inputPath = path.resolve(dataDir, "bpe-filtered.csv");

  console.log("=".repeat(60));
  console.log("Import BPE en base de donnees");
  console.log("=".repeat(60));
  console.log(`Fichier source: ${inputPath}`);
  console.log("-".repeat(60));

  // Vérifier que le fichier existe
  let fileSize: number;
  try {
    const stats = statSync(inputPath);
    fileSize = stats.size;
    console.log(`Taille fichier: ${(fileSize / 1024 / 1024).toFixed(2)} Mo`);
  } catch {
    console.error(`ERREUR: Fichier non trouve: ${inputPath}`);
    console.error("Lance d abord: pnpm db:bpe:filter");
    process.exit(1);
  }

  // Connexion à la base
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

  // Créer l'entrée de log
  const logResult = await db.execute<{ id: number }>(sql`
    INSERT INTO raw_imports_log (dataset_name, source_path, file_size_bytes)
    VALUES (${DATASET_NAME}, ${inputPath}, ${fileSize})
    RETURNING id
  `);
  const logId = (logResult as unknown as Array<{ id: number }>)[0].id;
  console.log(`Log import cree: id=${logId}`);

  const stats: ImportStats = {
    totalLines: 0,
    importedLines: 0,
    errorLines: 0,
    startTime: Date.now(),
  };

  try {
    // Truncate la table existante
    console.log("Vidage de la table raw_bpe...");
    await db.execute(sql`TRUNCATE TABLE raw_bpe RESTART IDENTITY`);

    // Lire le CSV
    const inputStream = createReadStream(inputPath, { encoding: "utf-8" });
    const rl = createInterface({
      input: inputStream,
      crlfDelay: Infinity,
    });

    let headerIndices: Map<string, number> | null = null;
    let isFirstLine = true;
    let batch: BpeRow[] = [];

    for await (const line of rl) {
      if (isFirstLine) {
        // Parser le header
        const headers = line.split(SEPARATOR);
        headerIndices = new Map(headers.map((h, i) => [h, i]));
        isFirstLine = false;
        continue;
      }

      stats.totalLines++;
      const values = line.split(SEPARATOR);

      const row: BpeRow = {
        codeEquipement: values[headerIndices!.get("TYPEQU")!],
        codeCommune: values[headerIndices!.get("DEPCOM")!],
        longitude: values[headerIndices!.get("LONGITUDE")!],
        latitude: values[headerIndices!.get("LATITUDE")!],
        qualiteXy: values[headerIndices!.get("QUALITE_XY")!] || null,
        anneeSource: parseInt(values[headerIndices!.get("AN")!], 10),
      };

      batch.push(row);

      // Insérer par batch
      if (batch.length >= BATCH_SIZE) {
        await insertBatch(db, batch);
        stats.importedLines += batch.length;
        batch = [];

        // Afficher la progression
        if (stats.importedLines % 10000 === 0) {
          const elapsed = (Date.now() - stats.startTime) / 1000;
          console.log(
            `Progression: ${stats.importedLines.toLocaleString()} lignes importees (${elapsed.toFixed(1)}s)`,
          );
        }
      }
    }

    // Insérer le reste
    if (batch.length > 0) {
      await insertBatch(db, batch);
      stats.importedLines += batch.length;
    }

    // Mettre à jour le log
    const elapsed = (Date.now() - stats.startTime) / 1000;
    await db.execute(sql`
      UPDATE raw_imports_log
      SET finished_at = NOW(),
          status = 'success',
          rows_imported = ${stats.importedLines},
          rows_total = ${stats.totalLines}
      WHERE id = ${logId}
    `);

    console.log("-".repeat(60));
    console.log("TERMINE !");
    console.log("-".repeat(60));
    console.log(`Lignes importees: ${stats.importedLines.toLocaleString()}`);
    console.log(`Duree: ${elapsed.toFixed(1)}s`);
    console.log(`Vitesse: ${Math.round(stats.importedLines / elapsed)} lignes/s`);
  } catch (error) {
    // Logger l'erreur
    const errorMessage = error instanceof Error ? error.message : String(error);
    await db.execute(sql`
      UPDATE raw_imports_log
      SET finished_at = NOW(),
          status = 'failed',
          rows_imported = ${stats.importedLines},
          rows_total = ${stats.totalLines},
          error_message = ${errorMessage}
      WHERE id = ${logId}
    `);
    throw error;
  } finally {
    await client.end();
    console.log("Connexion base de donnees fermee");
  }
}

async function insertBatch(db: ReturnType<typeof drizzle>, batch: BpeRow[]): Promise<void> {
  if (batch.length === 0) return;

  // Construire la requête d'insertion en bulk
  const values = batch
    .map(
      (row) =>
        `(${escapeString(row.codeEquipement)}, ${escapeString(row.codeCommune)}, ` +
        `${row.longitude}, ${row.latitude}, ${escapeStringOrNull(row.qualiteXy)}, ${row.anneeSource})`,
    )
    .join(",\n");

  await db.execute(
    sql.raw(`
    INSERT INTO raw_bpe (code_equipement, code_commune, longitude, latitude, qualite_xy, annee_source)
    VALUES ${values}
  `),
  );
}

function escapeString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function escapeStringOrNull(value: string | null): string {
  return value ? escapeString(value) : "NULL";
}

// Exécution
importBpe().catch((error: unknown) => {
  console.error("Erreur:", error);
  process.exit(1);
});
