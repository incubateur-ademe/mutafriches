/* eslint-disable no-console */
/**
 * Script d'import du référentiel des quartiers prioritaires de la politique de la ville (QPV).
 *
 * Usage (depuis la racine du monorepo) :
 *   pnpm db:qpv:import
 *
 * Source : data.gouv.fr — « Quartiers prioritaires de la politique de la ville (QPV) »
 * (ANCT, millésime 2024, licence Ouverte)
 *   https://www.data.gouv.fr/datasets/quartiers-prioritaires-de-la-politique-de-la-ville-qpv
 *
 * L'ANCT publie le GeoJSON directement en WGS84 (hexagone + outre-mer dans un seul fichier) :
 * aucune conversion GDAL, contrairement à l'ICU et à la base ITE 3000. Le fichier est
 * néanmoins commité car la ressource data.gouv est un ZIP et le projet n'embarque aucune
 * dépendance d'archive (cf. ADR-0037). Régénération à chaque nouvel arrêté, en filtrant les
 * propriétés inutiles et en ramenant les coordonnées à 6 décimales — sans simplification
 * géométrique, le critère étant scoré :
 *
 *   curl -sL -o qpv.zip "https://www.data.gouv.fr/fr/datasets/r/942d4ee8-8142-4556-8ea1-335537ce1119"
 *   unzip -o qpv.zip -d qpv && ogr2ogr -f GeoJSON -t_srs EPSG:4326 \
 *           -select code_qp,lib_qp,insee_com -lco COORDINATE_PRECISION=6 \
 *           src/scripts/data/qpv-2024.geojson \
 *           qpv/GEOJSON/QP2024_France_Hexagonale_Outre_Mer_WGS84.geojson
 *
 * Prérequis :
 *   - La migration 0032_raw_qpv.sql doit avoir été exécutée.
 *   - PostGIS doit être activé sur la base.
 *
 * Comportement :
 *   - Lit le GeoJSON local (WGS84)
 *   - Valide l'intégralité du fichier AVANT de vider la table (un fichier tronqué ou au
 *     schéma inattendu ne doit jamais écraser un référentiel valide)
 *   - Truncate raw_qpv puis insère par batch (idempotent)
 *   - Normalise les géométries en MultiPolygon valides (ST_MakeValid + ST_CollectionExtract)
 *   - Log la progression dans raw_imports_log
 */

import { readFileSync } from "fs";
import * as path from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql, SQL } from "drizzle-orm";
import postgres from "postgres";
import { getAppConfig } from "../config";

const GEOJSON_PATH = path.resolve(__dirname, "./data/qpv-2024.geojson");
const BATCH_SIZE = 200;
const DATASET_NAME = "qpv";

/**
 * Plancher de sécurité : le millésime 2024 compte 1 584 quartiers. En dessous de 1 300, le
 * fichier est tronqué ou la géographie a été redécoupée — on refuse d'écraser le référentiel.
 */
const MIN_QUARTIERS_ATTENDUS = 1300;

interface QpvFeature {
  type: "Feature";
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown } | null;
  properties: Record<string, unknown>;
}

interface QpvCollection {
  type: "FeatureCollection";
  features: QpvFeature[];
}

interface QpvRow {
  codeQpv: string;
  nomQpv: string;
  codeInsee: string;
  geometrie: string;
}

/** Convertit une feature en ligne prête à insérer, ou lève si elle est inexploitable. */
function versLigne(feature: QpvFeature, index: number): QpvRow {
  const codeQpv = String(feature.properties?.code_qp ?? "").trim();
  if (codeQpv === "") {
    throw new Error(`Feature ${index} : code_qp manquant`);
  }

  const nomQpv = String(feature.properties?.lib_qp ?? "").trim();
  if (nomQpv === "") {
    throw new Error(`Feature ${index} (${codeQpv}) : lib_qp manquant`);
  }

  // Un QPV peut être à cheval sur plusieurs communes : la propriété liste alors les codes.
  const codeInsee = String(feature.properties?.insee_com ?? "")
    .split(/[,\s]+/)
    .map((code) => code.trim())
    .filter((code) => code !== "")
    .join(",");
  if (codeInsee === "") {
    throw new Error(`Feature ${index} (${codeQpv}) : insee_com manquant`);
  }

  if (!feature.geometry || !feature.geometry.coordinates) {
    throw new Error(`Feature ${index} (${codeQpv}) : géométrie manquante`);
  }

  return { codeQpv, nomQpv, codeInsee, geometrie: JSON.stringify(feature.geometry) };
}

async function insererBatch(db: ReturnType<typeof drizzle>, batch: QpvRow[]): Promise<void> {
  if (batch.length === 0) return;

  // ST_CollectionExtract(..., 3) avant ST_Multi : sur une géométrie auto-sécante, ST_MakeValid
  // rend une GEOMETRYCOLLECTION que la colonne MultiPolygon refuse. Un seul QPV du millésime
  // 2024 est concerné (QN09104M) et la composante non surfacique écartée est d'aire nulle.
  const valeurs: SQL[] = batch.map(
    (row) => sql`(
      ${row.codeQpv},
      ${row.nomQpv},
      ${row.codeInsee},
      ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON(${row.geometrie}), 4326)), 3))
    )`,
  );

  await db.execute(sql`
    INSERT INTO raw_qpv (code_qpv, nom_qpv, code_insee, geom)
    VALUES ${sql.join(valeurs, sql`, `)}
  `);
}

async function importQpv(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Import des quartiers prioritaires de la ville (QPV) en base de données");
  console.log("=".repeat(60));
  console.log(`Source : ${GEOJSON_PATH}`);
  console.log("-".repeat(60));

  console.log("\nLecture du fichier GeoJSON...");
  const geojson = JSON.parse(readFileSync(GEOJSON_PATH, "utf-8")) as QpvCollection;
  const features = geojson.features ?? [];
  console.log(`Fichier lu : ${features.length} quartiers`);

  // Validation complète avant toute écriture : on ne vide la table que si le fichier tient.
  const lignes = features.map((feature, index) => versLigne(feature, index));

  if (lignes.length < MIN_QUARTIERS_ATTENDUS) {
    throw new Error(
      `Fichier suspect : ${lignes.length} quartiers lus, minimum attendu ${MIN_QUARTIERS_ATTENDUS}. ` +
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
    console.log("Vidage de la table raw_qpv...");
    await db.execute(sql`TRUNCATE TABLE raw_qpv RESTART IDENTITY`);

    console.log("Début de l'import...\n");
    for (let i = 0; i < lignes.length; i += BATCH_SIZE) {
      const batch = lignes.slice(i, i + BATCH_SIZE);
      await insererBatch(db, batch);
      importees += batch.length;
      process.stdout.write(`\rProgression : ${importees}/${lignes.length} quartiers importés`);
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
      surface_ha: number;
      geom_invalides: string;
    }>(sql`
      SELECT
        COUNT(*) AS total,
        -- un QPV à cheval liste plusieurs communes : les déplier pour ne pas sous-compter
        (SELECT COUNT(DISTINCT code)
         FROM raw_qpv, unnest(string_to_array(code_insee, ',')) AS code) AS communes,
        ROUND(SUM(ST_Area(geom::geography)) / 10000) AS surface_ha,
        COUNT(*) FILTER (WHERE geom IS NULL OR NOT ST_IsValid(geom)) AS geom_invalides
      FROM raw_qpv
    `);
    const stats = (
      statsResult as unknown as Array<{
        total: string;
        communes: string;
        surface_ha: number;
        geom_invalides: string;
      }>
    )[0];

    console.log("-".repeat(60));
    console.log("TERMINÉ !");
    console.log("-".repeat(60));
    console.log(`Quartiers importés : ${stats.total}`);
    console.log(`Communes couvertes : ${stats.communes}`);
    console.log(`Surface totale : ${stats.surface_ha} ha`);
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

importQpv().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("\nErreur :", message);
  const cause = (error as { cause?: { message?: string } })?.cause;
  if (cause?.message) {
    console.error("  cause :", cause.message);
  }
  process.exit(1);
});
