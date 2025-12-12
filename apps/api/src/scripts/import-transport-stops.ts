/* eslint-disable no-console, @typescript-eslint/no-non-null-assertion */
/**
 * Script d'import des points d'arrêt de transport en France
 *
 * Usage (depuis apps/api):
 *   pnpm db:transport-stops:import
 *
 * Prérequis:
 *   - La migration 0008_add_transport_stops.sql doit avoir été exécutée
 *   - La migration 0009_deduplicate_transport_stops.sql doit avoir été exécutée
 *   - PostGIS doit être activé sur la base
 *   - Connexion internet pour télécharger le fichier CSV (~144 Mo)
 *
 * Comportement:
 *   - Télécharge temporairement le CSV dans /tmp ou data/
 *   - Truncate la table raw_transport_stops avant import (full replace)
 *   - Parse en streaming avec for await (readline natif)
 *   - Filtre les types pertinents et les coordonnées France métropolitaine
 *   - Insère par batch de 1000 lignes
 *   - Ignore les doublons (même coordonnées) via ON CONFLICT DO NOTHING
 *   - Crée l'index spatial PostGIS
 *   - Supprime le fichier temporaire
 *
 * Note sur les doublons:
 *   Le fichier source contient ~620k lignes dont beaucoup de doublons
 *   (même gare avec plusieurs quais, par exemple)
 *   La contrainte UNIQUE sur (stop_lat, stop_lon) ne garde qu'un arrêt par position
 *   Résultat: ~250-300k arrêts uniques au lieu de ~587k
 *
 * Source: https://transport.data.gouv.fr/datasets/arrets-de-transport-en-france
 */

import * as https from "https";
import {
  createReadStream,
  createWriteStream,
  unlinkSync,
  statSync,
  existsSync,
  mkdirSync,
} from "fs";
import { createInterface } from "readline";
import * as path from "path";
import { tmpdir } from "os";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as postgres from "postgres";

// Configuration
const CSV_URL =
  "https://transport-data-gouv-fr-resource-history-prod.cellar-c2.services.clever-cloud.com/81333/81333.20250909.084307.387696.csv";

const BATCH_SIZE = 1000;
const DATASET_NAME = "transport-stops-france";

// Types pertinents pour l'enrichissement transport
// 0 ou vide: Arrêt/quai (tous les arrêts de bus, tram, etc.)
// 1: Station (gare ferroviaire, station de métro)
const RELEVANT_LOCATION_TYPES = ["0", "1", ""];

interface ImportStats {
  totalLines: number;
  importedLines: number;
  errorLines: number;
  startTime: number;
}

interface TransportStopRow {
  stopName: string;
  stopLat: number;
  stopLon: number;
  locationType: string;
}

/**
 * Parse une ligne CSV en tenant compte des guillemets
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Obtient le répertoire temporaire approprié selon l'environnement
 */
function getTempDirectory(): string {
  // Sur Scalingo et autres PaaS, utiliser le répertoire tmp système
  if (process.env.SCALINGO_POSTGRESQL_URL || process.env.NODE_ENV === "production") {
    return tmpdir();
  }

  // En local, utiliser data/ si disponible
  const dataDir = path.resolve(__dirname, "../../data");

  if (existsSync(dataDir)) {
    return dataDir;
  }

  // Créer le répertoire data/ en local s'il n'existe pas
  try {
    mkdirSync(dataDir, { recursive: true });
    return dataDir;
  } catch {
    return tmpdir();
  }
}

/**
 * Télécharge le fichier CSV dans un fichier temporaire
 */
async function downloadFile(url: string, destinationPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(destinationPath);

    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode as number}: ${response.statusMessage}`));
          return;
        }

        let downloadedBytes = 0;
        response.on("data", (chunk) => {
          downloadedBytes += chunk.length;
          // Afficher progression tous les 20 MB
          if (downloadedBytes % (20 * 1024 * 1024) < chunk.length) {
            process.stdout.write(
              `\rTelechargement: ${(downloadedBytes / 1024 / 1024).toFixed(1)} MB`,
            );
          }
        });

        response.pipe(file);

        file.on("finish", () => {
          process.stdout.write(
            `\rTelechargement: ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB - Termine\n`,
          );
          file.close();
          resolve();
        });
      })
      .on("error", (error) => {
        try {
          unlinkSync(destinationPath);
        } catch {
          // Ignorer si le fichier n'existe pas
        }
        reject(error);
      });

    file.on("error", (error) => {
      try {
        unlinkSync(destinationPath);
      } catch {
        // Ignorer si le fichier n'existe pas
      }
      reject(error);
    });
  });
}

async function importTransportStops(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Import Transport Stops en base de donnees");
  console.log("=".repeat(60));
  console.log(`Source: ${CSV_URL}`);
  console.log("Taille attendue: ~144 Mo");
  console.log("-".repeat(60));

  // Préparer le chemin du fichier temporaire
  const tempDir = getTempDirectory();
  const tempFilePath = path.join(tempDir, "transport-stops-temp.csv");
  console.log(`Repertoire temporaire: ${tempDir}`);

  // Télécharger le fichier
  console.log("\nTelechargement du fichier CSV...");
  await downloadFile(CSV_URL, tempFilePath);

  const fileSize = statSync(tempFilePath).size;
  console.log(`Fichier telecharge: ${(fileSize / 1024 / 1024).toFixed(2)} Mo\n`);

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
    VALUES (${DATASET_NAME}, ${CSV_URL}, ${fileSize})
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
    console.log("Vidage de la table raw_transport_stops...");
    await db.execute(sql`TRUNCATE TABLE raw_transport_stops RESTART IDENTITY`);

    // Parser et importer depuis le fichier local
    console.log("Debut du parsing et de l import...\n");
    await parseAndImportCSV(db, tempFilePath, stats);

    // Créer l'index spatial s'il n'existe pas déjà
    console.log("\nCreation de l index spatial...");
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS raw_transport_stops_spatial_idx 
      ON raw_transport_stops 
      USING gist (ST_SetSRID(ST_MakePoint(stop_lon, stop_lat), 4326))
    `);
    console.log("Index spatial cree/verifie");

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

    // Statistiques finales
    const result = await db.execute<{ total: string; types_count: string }>(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT location_type) as types_count
      FROM raw_transport_stops
    `);

    console.log("\nStatistiques:");
    const finalStats = (result as unknown as Array<{ total: string; types_count: string }>)[0];
    console.log(`Total points d arret: ${parseInt(finalStats.total).toLocaleString()}`);
    console.log(`Types differents: ${finalStats.types_count}`);
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
    // Nettoyer le fichier temporaire
    try {
      unlinkSync(tempFilePath);
      console.log("\nFichier temporaire supprime");
    } catch {
      // Ignorer si le fichier n'existe pas
    }

    await client.end();
    console.log("Connexion base de donnees fermee");
  }
}

async function parseAndImportCSV(
  db: ReturnType<typeof drizzle>,
  filePath: string,
  stats: ImportStats,
): Promise<void> {
  const inputStream = createReadStream(filePath, { encoding: "utf-8" });
  const rl = createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  });

  let headers: string[] = [];
  let isFirstLine = true;
  let batch: TransportStopRow[] = [];

  for await (const line of rl) {
    // Première ligne = headers
    if (isFirstLine) {
      headers = parseCSVLine(line);
      isFirstLine = false;
      continue;
    }

    stats.totalLines++;

    // Afficher la progression tous les 10000 lignes
    if (stats.totalLines % 10000 === 0) {
      const elapsed = (Date.now() - stats.startTime) / 1000;
      process.stdout.write(
        `\rProgression: ${stats.totalLines.toLocaleString()} lignes lues, ` +
          `${stats.importedLines.toLocaleString()} importees (${elapsed.toFixed(1)}s)`,
      );
    }

    // Parser la ligne
    const values = parseCSVLine(line);

    // Créer un objet avec les headers comme clés
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    // Extraire les champs nécessaires
    const stopName = row["stop-name"] || "";
    const stopLat = row["stop_lat"] || "";
    const stopLon = row["stop_lon"] || "";
    const locationType = row["location_type"] || "0";

    // Filtrer par type de localisation
    if (!RELEVANT_LOCATION_TYPES.includes(locationType)) {
      continue;
    }

    // Valider les coordonnées
    const lat = parseFloat(stopLat);
    const lon = parseFloat(stopLon);

    if (isNaN(lat) || isNaN(lon)) {
      stats.errorLines++;
      continue;
    }

    // Filtrer les coordonnées hors France métropolitaine (approximatif)
    if (lat < 41 || lat > 51 || lon < -5 || lon > 10) {
      continue;
    }

    batch.push({
      stopName,
      stopLat: lat,
      stopLon: lon,
      locationType,
    });

    // Importer par batch
    if (batch.length >= BATCH_SIZE) {
      try {
        await insertBatch(db, batch);
        stats.importedLines += batch.length;
      } catch (error) {
        console.error("\nErreur lors de l insertion du batch:", error);
        stats.errorLines += batch.length;
      }
      batch = [];
    }
  }

  // Insérer le dernier batch
  if (batch.length > 0) {
    try {
      await insertBatch(db, batch);
      stats.importedLines += batch.length;
    } catch (error) {
      console.error("\nErreur lors de l insertion du dernier batch:", error);
      stats.errorLines += batch.length;
    }
  }

  process.stdout.write("\n");
}

async function insertBatch(
  db: ReturnType<typeof drizzle>,
  batch: TransportStopRow[],
): Promise<void> {
  if (batch.length === 0) return;

  // Construire la requête d'insertion en bulk
  const values = batch
    .map(
      (row) =>
        `(${escapeString(row.stopName)}, ${row.stopLat}, ${row.stopLon}, ${escapeString(row.locationType)})`,
    )
    .join(",\n");

  await db.execute(
    sql.raw(`
    INSERT INTO raw_transport_stops (stop_name, stop_lat, stop_lon, location_type)
    VALUES ${values}
    ON CONFLICT (stop_lat, stop_lon) DO NOTHING
  `),
  );
}

function escapeString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

// Exécution
importTransportStops().catch((error: unknown) => {
  console.error("\nErreur:", error);
  process.exit(1);
});
