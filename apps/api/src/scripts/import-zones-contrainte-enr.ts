/* eslint-disable no-console */
/**
 * Script d'import des zones de contrainte pour raccorder de nouveaux projets EnR (Enedis/RTE).
 *
 * Usage (depuis la racine du monorepo) :
 *   pnpm db:zones-contrainte-enr:import
 *
 * Source : Enedis — « Carte des zones en contrainte pour raccorder de nouveaux projets de
 * production HTA/BT », https://observatoire.enedis.fr/services/carte-zones-contrainte-projets-enr
 *
 * Lit le GeoJSON compressé commité `data/zones-contrainte-enr.geojson.gz`, produit par
 * `pnpm data:zones-contrainte-enr:preparer` à partir du fichier Enedis téléchargé à la main
 * (protection anti-robots). Rafraîchissement mensuel, cf. ADR-0046.
 *
 * Prérequis :
 *   - La migration 0036_raw_zones_contrainte_enr.sql doit avoir été exécutée.
 *   - PostGIS doit être activé sur la base.
 *
 * Comportement :
 *   - Valide l'intégralité du fichier AVANT de vider la table (un fichier tronqué ou au
 *     schéma inattendu ne doit jamais écraser un référentiel valide)
 *   - Remplace le contenu de raw_zones_contrainte_enr dans une transaction (idempotent)
 *   - Normalise les géométries en MultiPolygon valides (ST_MakeValid + ST_CollectionExtract)
 *   - Log la progression dans raw_imports_log
 */

import { readFileSync } from "fs";
import * as path from "path";
import { gunzipSync } from "zlib";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql, SQL } from "drizzle-orm";
import postgres from "postgres";
import { getAppConfig } from "../config";
import { validerCollection } from "./zones-contrainte-enr/zones-contrainte-enr.format";

const GEOJSON_GZ_PATH = path.resolve(__dirname, "./data/zones-contrainte-enr.geojson.gz");

const BATCH_SIZE = 100;
const DATASET_NAME = "zones-contrainte-enr";

interface ZoneRow {
  idZone: string;
  statut: string;
  geometrie: string;
}

interface Executeur {
  execute(requete: SQL): Promise<unknown>;
}

async function insererBatch(db: Executeur, batch: ZoneRow[]): Promise<void> {
  if (batch.length === 0) return;

  // ST_CollectionExtract(..., 3) avant ST_Multi : sur une géométrie auto-sécante, ST_MakeValid
  // rend une GEOMETRYCOLLECTION que la colonne MultiPolygon refuse.
  const valeurs: SQL[] = batch.map(
    (row) => sql`(
      ${row.idZone},
      ${row.statut},
      ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON(${row.geometrie}), 4326)), 3))
    )`,
  );

  await db.execute(sql`
    INSERT INTO raw_zones_contrainte_enr (id_zone, statut, geom)
    VALUES ${sql.join(valeurs, sql`, `)}
  `);
}

async function importZonesContrainteEnr(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Import des zones de contrainte EnR (Enedis) en base de données");
  console.log("=".repeat(60));
  console.log(`Source : ${GEOJSON_GZ_PATH}`);
  console.log("-".repeat(60));

  console.log("\nLecture du fichier...");
  const contenu = gunzipSync(readFileSync(GEOJSON_GZ_PATH)).toString("utf-8");

  // Validation complète avant toute écriture : on ne vide la table que si le fichier tient.
  const lignes: ZoneRow[] = validerCollection(JSON.parse(contenu) as unknown).features.map((f) => ({
    idZone: f.properties.id,
    statut: f.properties.statut,
    geometrie: JSON.stringify(f.geometry),
  }));
  console.log(`Fichier lu : ${lignes.length} zones`);

  const client = postgres(getAppConfig().database);
  const db = drizzle(client);
  const debut = Date.now();
  let importees = 0;

  const logResult = await db.execute<{ id: number }>(sql`
    INSERT INTO raw_imports_log (dataset_name, source_path)
    VALUES (${DATASET_NAME}, ${GEOJSON_GZ_PATH})
    RETURNING id
  `);
  const logId = (logResult as unknown as Array<{ id: number }>)[0].id;
  console.log(`Log import créé : id=${logId}`);

  try {
    // Transaction : l'enrichissement ne doit jamais lire une table vidée à moitié remplie.
    await db.transaction(async (tx) => {
      console.log("Vidage de la table raw_zones_contrainte_enr...");
      await tx.execute(sql`TRUNCATE TABLE raw_zones_contrainte_enr RESTART IDENTITY`);

      console.log("Début de l'import...\n");
      for (let i = 0; i < lignes.length; i += BATCH_SIZE) {
        const batch = lignes.slice(i, i + BATCH_SIZE);
        await insererBatch(tx, batch);
        importees += batch.length;
        process.stdout.write(`\rProgression : ${importees}/${lignes.length} zones importées`);
      }
      process.stdout.write("\n");
    });

    const duree = (Date.now() - debut) / 1000;
    await db.execute(sql`
      UPDATE raw_imports_log
      SET finished_at = NOW(),
          status = 'success',
          rows_imported = ${importees},
          rows_total = ${lignes.length}
      WHERE id = ${logId}
    `);

    const statsResult = await db.execute<{ statut: string; total: string }>(sql`
      SELECT statut, COUNT(*) AS total
      FROM raw_zones_contrainte_enr
      GROUP BY statut
      ORDER BY statut
    `);
    const stats = statsResult as unknown as Array<{ statut: string; total: string }>;

    console.log("-".repeat(60));
    console.log("TERMINÉ !");
    console.log("-".repeat(60));
    for (const { statut, total } of stats) {
      console.log(`${statut} : ${total} zones`);
    }
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

importZonesContrainteEnr().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("\nErreur :", message);
  const cause = (error as { cause?: { message?: string } })?.cause;
  if (cause?.message) {
    console.error("  cause :", cause.message);
  }
  process.exit(1);
});
