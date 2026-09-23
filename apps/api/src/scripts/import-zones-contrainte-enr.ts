/* eslint-disable no-console */
/**
 * Script d'import des zones de contrainte pour raccorder de nouveaux projets EnR (Enedis/RTE).
 *
 * Usage (depuis la racine du monorepo) :
 *   pnpm db:zones-contrainte-enr:import <chemin/vers/capca.json>
 *
 * En production, le fichier est transmis au conteneur par `--file` (déposé dans /tmp/uploads) :
 *   scalingo --app <app> run --file capca.json \
 *     "pnpm db:zones-contrainte-enr:import /tmp/uploads/capca.json"
 *
 * Source : Enedis — « Carte des zones en contrainte pour raccorder de nouveaux projets de
 * production HTA/BT », https://observatoire.enedis.fr/services/carte-zones-contrainte-projets-enr
 *
 * Le fichier (~27 Mo, WGS84) est servi derrière une protection anti-robots qui refuse les
 * téléchargements automatisés : il se récupère à la main depuis un navigateur, en ouvrant
 *   https://observatoire.enedis.fr/sites/enedis_ote/files/processed_json/capca.json
 * puis en l'enregistrant. Rafraîchissement mensuel, cf. ADR-0046.
 *
 * Prérequis :
 *   - La migration 0036_raw_zones_contrainte_enr.sql doit avoir été exécutée.
 *   - PostGIS doit être activé sur la base.
 *
 * Comportement :
 *   - Valide l'intégralité du fichier AVANT de vider la table (un fichier tronqué ou au
 *     schéma inattendu ne doit jamais écraser un référentiel valide)
 *   - Truncate raw_zones_contrainte_enr puis insère par batch (idempotent)
 *   - Normalise les géométries en MultiPolygon valides (ST_MakeValid + ST_CollectionExtract)
 *   - Log la progression dans raw_imports_log
 */

import { readFileSync } from "fs";
import * as path from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql, SQL } from "drizzle-orm";
import postgres from "postgres";
import { getAppConfig } from "../config";

const BATCH_SIZE = 100;
const DATASET_NAME = "zones-contrainte-enr";

/** Statuts publiés par Enedis. Un statut inconnu signale un changement de format. */
const STATUTS_CONNUS = ["TRES_FAVORABLE", "FAVORABLE", "EN_TENSION", "SATUREE", "ELD"] as const;

/**
 * Plancher de sécurité : la carte compte ~2 300 zones de postes sources. En dessous de 2 000,
 * le fichier est tronqué ou le format a changé — on refuse d'écraser le référentiel.
 */
const MIN_ZONES_ATTENDUES = 2000;

interface ZoneSource {
  id?: unknown;
  status?: unknown;
  geometry?: { type?: string; coordinates?: unknown } | null;
}

interface FichierCapca {
  data?: {
    geo_status_data?: Record<string, ZoneSource>;
  };
}

interface ZoneRow {
  idZone: string;
  statut: string;
  geometrie: string;
}

/** Convertit une zone en ligne prête à insérer, ou lève si elle est inexploitable. */
function versLigne(cle: string, zone: ZoneSource): ZoneRow {
  const idZone = String(zone.id ?? cle).trim();
  if (idZone === "") {
    throw new Error(`Zone ${cle} : identifiant manquant`);
  }

  const statut = String(zone.status ?? "").trim();
  if (!(STATUTS_CONNUS as readonly string[]).includes(statut)) {
    throw new Error(`Zone ${idZone} : statut inconnu « ${statut} »`);
  }

  const type = zone.geometry?.type;
  if (!zone.geometry?.coordinates || (type !== "Polygon" && type !== "MultiPolygon")) {
    throw new Error(`Zone ${idZone} : géométrie manquante ou non surfacique`);
  }

  return { idZone, statut, geometrie: JSON.stringify(zone.geometry) };
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

async function importZonesContrainteEnr(cheminFichier: string): Promise<void> {
  console.log("=".repeat(60));
  console.log("Import des zones de contrainte EnR (Enedis) en base de données");
  console.log("=".repeat(60));
  console.log(`Source : ${cheminFichier}`);
  console.log("-".repeat(60));

  console.log("\nLecture du fichier...");
  const fichier = JSON.parse(readFileSync(cheminFichier, "utf-8")) as FichierCapca;
  const zones = fichier.data?.geo_status_data;
  if (!zones || typeof zones !== "object") {
    throw new Error("Format inattendu : data.geo_status_data absent");
  }

  // Validation complète avant toute écriture : on ne vide la table que si le fichier tient.
  const lignes = Object.entries(zones).map(([cle, zone]) => versLigne(cle, zone));
  console.log(`Fichier lu : ${lignes.length} zones`);

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
    VALUES (${DATASET_NAME}, ${cheminFichier})
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

const argument = process.argv[2];
if (!argument) {
  console.error("Usage : pnpm db:zones-contrainte-enr:import <chemin/vers/capca.json>");
  process.exit(1);
}

// Via `pnpm --filter api`, le cwd devient apps/api : on résout depuis le dossier d'appel.
const dossierAppel = process.env.INIT_CWD ?? process.cwd();

importZonesContrainteEnr(path.resolve(dossierAppel, argument)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("\nErreur :", message);
  const cause = (error as { cause?: { message?: string } })?.cause;
  if (cause?.message) {
    console.error("  cause :", cause.message);
  }
  process.exit(1);
});
