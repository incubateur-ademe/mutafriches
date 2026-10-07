/* eslint-disable no-console */
/**
 * Prépare le référentiel commité des zones d'activité économique (ZAE) à partir du GeoPackage Fusac.
 *
 * Usage (depuis la racine du monorepo, après `pnpm --filter api build:nest`) :
 *   pnpm data:zae:preparer <chemin/vers/fr_fusac_cerema_2025.gpkg>
 *
 * Prérequis : `ogr2ogr` (GDAL) dans le PATH. Le GPKG (~10 Go décompressé) se télécharge à la main
 * sur https://cerema.app.box.com/v/fusac-cerema-fr (archive .7z, `bsdtar -xf` suffit).
 *
 * Ne garde que la couche des sites d'activité (SITE-ECO) de type « zone d'activité économique »,
 * en activité, en métropole, simplifiés à 3 m et arrondis à 5 décimales, et écrit
 * `src/scripts/data/zae-fusac.geojson.gz` (~5 Mo). Cf. ADR-0049.
 */

import { execFileSync } from "child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import * as path from "path";
import { gunzipSync, gzipSync } from "zlib";
import { validerCollection } from "./zae/zae.format";

// Écrit dans les sources, pas dans dist : c'est le fichier commité (dist/src/scripts -> src/scripts)
const SORTIE = path.resolve(__dirname, "../../../src/scripts/data/zae-fusac.geojson.gz");

const COUCHE = "fr_fusac_cerema_site_eco_2025";
// DROM exclus : leurs géométries ne sont pas en Lambert-93 malgré le SRID déclaré
const FILTRE =
  "site_type = 'zone d''activité économique' AND site_etat = 'existant et actif' AND site_coddep NOT LIKE '97%'";
const TOLERANCE_SIMPLIFICATION_M = "3";
const PRECISION_COORDONNEES = "5";

function extraire(gpkg: string, destination: string): void {
  execFileSync(
    "ogr2ogr",
    [
      ...["-f", "GeoJSON", destination, gpkg, COUCHE],
      ...["-where", FILTRE],
      ...["-select", "site_id"],
      ...["-t_srs", "EPSG:4326"],
      ...["-nlt", "MULTIPOLYGON"],
      ...["-simplify", TOLERANCE_SIMPLIFICATION_M],
      ...["-lco", `COORDINATE_PRECISION=${PRECISION_COORDONNEES}`],
    ],
    { stdio: "inherit" },
  );
}

function preparer(gpkg: string): void {
  console.log(`Source : ${gpkg}`);
  const dossier = mkdtempSync(path.join(tmpdir(), "zae-"));
  try {
    const brut = path.join(dossier, "zae.geojson");
    extraire(gpkg, brut);

    const collection = validerCollection(JSON.parse(readFileSync(brut, "utf-8")) as unknown);
    const contenu = JSON.stringify(collection);
    console.log(`Sites : ${collection.features.length}`);

    if (existsSync(SORTIE) && gunzipSync(readFileSync(SORTIE)).toString("utf-8") === contenu) {
      console.log("\nAucun changement par rapport à la version commitée : fichier non réécrit.");
      return;
    }

    const gz = gzipSync(contenu, { level: 9 });
    writeFileSync(SORTIE, gz);
    console.log(`\nÉcrit : ${SORTIE} (${(gz.length / 1e6).toFixed(1)} Mo)`);
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
}

const argument = process.argv[2];
if (!argument) {
  console.error("Usage : pnpm data:zae:preparer <chemin/vers/fr_fusac_cerema_2025.gpkg>");
  process.exit(1);
}

try {
  // Via `pnpm --filter api`, le cwd devient apps/api : on résout depuis le dossier d'appel.
  preparer(path.resolve(process.env.INIT_CWD ?? process.cwd(), argument));
} catch (error: unknown) {
  console.error("\nErreur :", error instanceof Error ? error.message : String(error));
  process.exit(1);
}
