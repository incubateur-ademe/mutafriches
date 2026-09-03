/* eslint-disable no-console */
/**
 * Script d'import du référentiel des îlots de chaleur urbain (ICU) en base.
 *
 * Usage (depuis la racine du monorepo) :
 *   pnpm db:icu:import
 *
 * Source : data.gouv.fr — « Cartographie nationale des indicateurs liés à l'îlot de
 * chaleur urbain » (CSTB, projet SCO Sat4BDNB, licence LOV2)
 *   https://www.data.gouv.fr/datasets/cartographie-nationale-des-indicateurs-lies-a-lilot-de-chaleur-urbain
 *
 * La ressource publiée est un ZIP contenant un GeoPackage en Lambert-93 : illisible sans
 * GDAL, qui n'est pas disponible au runtime Scalingo. Le fichier est donc converti hors
 * ligne puis commité, comme la base ITE 3000 (cf. ADR-0034). Commande de régénération à
 * chaque nouveau millésime du dataset :
 *
 *   ogr2ogr -f GeoJSON -t_srs EPSG:4326 -select code_giris,iuhi \
 *           -simplify 10 -lco COORDINATE_PRECISION=6 \
 *           src/scripts/data/indicateurs-icu.geojson indicateurs_icu.gpkg
 *
 * Prérequis :
 *   - La migration 0031_raw_icu.sql doit avoir été exécutée.
 *   - PostGIS doit être activé sur la base.
 *
 * Comportement :
 *   - Lit le GeoJSON local (WGS84)
 *   - Valide l'intégralité du fichier AVANT de vider la table (un fichier tronqué ou au
 *     schéma inattendu ne doit jamais écraser un référentiel valide)
 *   - Truncate raw_icu puis insère par batch (idempotent)
 *   - Normalise les géométries en MultiPolygon valides (ST_Multi + ST_MakeValid)
 *   - Log la progression dans raw_imports_log
 */

import { readFileSync } from "fs";
import * as path from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql, SQL } from "drizzle-orm";
import postgres from "postgres";
import { getAppConfig } from "../config";

const GEOJSON_PATH = path.resolve(__dirname, "./data/indicateurs-icu.geojson");
const BATCH_SIZE = 200;
const DATASET_NAME = "icu";

/**
 * Plancher de sécurité : le millésime 2024 compte 1 955 zones. En dessous de 1 500, le
 * fichier est tronqué ou le périmètre d'étude a fondu — on refuse d'écraser le référentiel.
 */
const MIN_ZONES_ATTENDUES = 1500;

interface IcuFeature {
  type: "Feature";
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown } | null;
  properties: Record<string, unknown>;
}

interface IcuCollection {
  type: "FeatureCollection";
  features: IcuFeature[];
}

interface IcuRow {
  codeGiris: string;
  iuhi: number;
  geometrie: string;
}

/** Convertit une feature en ligne prête à insérer, ou lève si elle est inexploitable. */
function versLigne(feature: IcuFeature, index: number): IcuRow {
  const codeGiris = String(feature.properties?.code_giris ?? "").trim();
  if (codeGiris === "") {
    throw new Error(`Feature ${index} : code_giris manquant`);
  }

  const iuhi = Number(feature.properties?.iuhi);
  if (!Number.isFinite(iuhi)) {
    throw new Error(`Feature ${index} (${codeGiris}) : iuhi absent ou non numérique`);
  }

  if (!feature.geometry || !feature.geometry.coordinates) {
    throw new Error(`Feature ${index} (${codeGiris}) : géométrie manquante`);
  }

  return { codeGiris, iuhi, geometrie: JSON.stringify(feature.geometry) };
}

async function insererBatch(db: ReturnType<typeof drizzle>, batch: IcuRow[]): Promise<void> {
  if (batch.length === 0) return;

  const valeurs: SQL[] = batch.map(
    (row) => sql`(
      ${row.codeGiris},
      ${row.iuhi},
      ST_Multi(ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON(${row.geometrie}), 4326)))
    )`,
  );

  await db.execute(sql`
    INSERT INTO raw_icu (code_giris, iuhi, geom)
    VALUES ${sql.join(valeurs, sql`, `)}
  `);
}

async function importIcu(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Import des îlots de chaleur urbain (ICU) en base de données");
  console.log("=".repeat(60));
  console.log(`Source : ${GEOJSON_PATH}`);
  console.log("-".repeat(60));

  console.log("\nLecture du fichier GeoJSON...");
  const geojson = JSON.parse(readFileSync(GEOJSON_PATH, "utf-8")) as IcuCollection;
  const features = geojson.features ?? [];
  console.log(`Fichier lu : ${features.length} zones`);

  // Validation complète avant toute écriture : on ne vide la table que si le fichier tient.
  const lignes = features.map((feature, index) => versLigne(feature, index));

  if (lignes.length < MIN_ZONES_ATTENDUES) {
    throw new Error(
      `Fichier suspect : ${lignes.length} zones lues, minimum attendu ${MIN_ZONES_ATTENDUES}. ` +
        "Import interrompu, le référentiel existant est conservé.",
    );
  }

  const client = postgres(getAppConfig().database);
  const db = drizzle(client);
  const debut = Date.now();
  let importees = 0;

  const logResult = await db.execute<{ id: number }>(sql`
    INSERT INTO raw_imports_log (dataset_name, source_path)
    VALUES (${DATASET_NAME}, ${GEOJSON_PATH})
    RETURNING id
  `);
  const logId = (logResult as unknown as Array<{ id: number }>)[0].id;
  console.log(`Log import créé : id=${logId}`);

  try {
    console.log("Vidage de la table raw_icu...");
    await db.execute(sql`TRUNCATE TABLE raw_icu RESTART IDENTITY`);

    console.log("Début de l'import...\n");
    for (let i = 0; i < lignes.length; i += BATCH_SIZE) {
      const batch = lignes.slice(i, i + BATCH_SIZE);
      await insererBatch(db, batch);
      importees += batch.length;
      process.stdout.write(`\rProgression : ${importees}/${lignes.length} zones importées`);
    }
    process.stdout.write("\n");

    const duree = (Date.now() - debut) / 1000;
    await db.execute(sql`
      UPDATE raw_imports_log
      SET finished_at = NOW(),
          status = 'success',
          rows_imported = ${importees},
          rows_total = ${lignes.length}
      WHERE id = ${logId}
    `);

    const statsResult = await db.execute<{
      total: string;
      communes: string;
      iuhi_min: number;
      iuhi_max: number;
      geom_invalides: string;
    }>(sql`
      SELECT
        COUNT(*) AS total,
        COUNT(DISTINCT LEFT(code_giris, 5)) AS communes,
        MIN(iuhi) AS iuhi_min,
        MAX(iuhi) AS iuhi_max,
        COUNT(*) FILTER (WHERE geom IS NULL OR NOT ST_IsValid(geom)) AS geom_invalides
      FROM raw_icu
    `);
    const stats = (
      statsResult as unknown as Array<{
        total: string;
        communes: string;
        iuhi_min: number;
        iuhi_max: number;
        geom_invalides: string;
      }>
    )[0];

    console.log("-".repeat(60));
    console.log("TERMINÉ !");
    console.log("-".repeat(60));
    console.log(`Zones importées : ${stats.total}`);
    console.log(`Communes couvertes : ${stats.communes}`);
    console.log(`Intensité ICU : ${stats.iuhi_min} à ${stats.iuhi_max} °C`);
    console.log(`Géométries invalides : ${stats.geom_invalides}`);
    console.log(`Durée : ${duree.toFixed(1)}s`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.execute(sql`
      UPDATE raw_imports_log
      SET finished_at = NOW(),
          status = 'failed',
          rows_imported = ${importees},
          rows_total = ${lignes.length},
          error_message = ${message}
      WHERE id = ${logId}
    `);
    throw error;
  } finally {
    await client.end();
    console.log("Connexion base de données fermée");
  }
}

importIcu().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("\nErreur :", message);
  const cause = (error as { cause?: { message?: string } })?.cause;
  if (cause?.message) {
    console.error("  cause :", cause.message);
  }
  process.exit(1);
});
