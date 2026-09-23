/* eslint-disable no-console */
/**
 * Prépare le référentiel commité des zones de contrainte EnR à partir du `capca.json` Enedis.
 *
 * Usage (depuis la racine du monorepo, après `pnpm --filter api build:nest`) :
 *   pnpm data:zones-contrainte-enr:preparer <chemin/vers/capca.json>
 *
 * Le fichier se télécharge à la main, depuis un navigateur (protection anti-robots, ADR-0046) :
 *   https://observatoire.enedis.fr/sites/enedis_ote/files/processed_json/capca.json
 *
 * Ne garde que l'identifiant et le statut des zones, arrondit les coordonnées à 5 décimales
 * et écrit `src/scripts/data/zones-contrainte-enr.geojson.gz` (~4 Mo, contre 27 Mo bruts).
 * Affiche les changements de statut par rapport à la version commitée : sans changement,
 * inutile de committer une nouvelle version.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import * as path from "path";
import { gunzipSync, gzipSync } from "zlib";
import {
  comparerStatuts,
  compterParStatut,
  convertirCapca,
  validerCollection,
  ZonesContrainteEnrCollection,
} from "./zones-contrainte-enr/zones-contrainte-enr.format";

// Écrit dans les sources, pas dans dist : c'est le fichier commité (dist/src/scripts -> src/scripts)
const SORTIE = path.resolve(__dirname, "../../../src/scripts/data/zones-contrainte-enr.geojson.gz");

function lireVersionCommitee(): {
  contenu: string;
  collection: ZonesContrainteEnrCollection;
} | null {
  if (!existsSync(SORTIE)) return null;
  const contenu = gunzipSync(readFileSync(SORTIE)).toString("utf-8");
  return { contenu, collection: validerCollection(JSON.parse(contenu) as unknown) };
}

function preparer(cheminCapca: string): void {
  console.log(`Source : ${cheminCapca}`);
  const nouvelle = convertirCapca(JSON.parse(readFileSync(cheminCapca, "utf-8")) as unknown);
  const contenu = JSON.stringify(nouvelle);

  console.log(`Zones : ${nouvelle.features.length}`);
  for (const [statut, total] of Object.entries(compterParStatut(nouvelle))) {
    console.log(`  ${statut} : ${total}`);
  }

  const ancienne = lireVersionCommitee();
  if (ancienne?.contenu === contenu) {
    console.log("\nAucun changement par rapport à la version commitée : fichier non réécrit.");
    return;
  }

  const changements = comparerStatuts(ancienne?.collection ?? null, nouvelle);
  console.log(`\nChangements de statut : ${ancienne ? changements.length : "première version"}`);
  if (ancienne) {
    for (const { id, avant, apres } of changements) {
      console.log(`  zone ${id} : ${avant ?? "(nouvelle)"} -> ${apres ?? "(supprimée)"}`);
    }
    if (changements.length === 0) {
      console.log("  aucun : seules les géométries ont changé");
    }
  }

  const gz = gzipSync(contenu, { level: 9 });
  writeFileSync(SORTIE, gz);
  console.log(`\nÉcrit : ${SORTIE} (${(gz.length / 1e6).toFixed(1)} Mo)`);
}

const argument = process.argv[2];
if (!argument) {
  console.error("Usage : pnpm data:zones-contrainte-enr:preparer <chemin/vers/capca.json>");
  process.exit(1);
}

try {
  // Via `pnpm --filter api`, le cwd devient apps/api : on résout depuis le dossier d'appel.
  preparer(path.resolve(process.env.INIT_CWD ?? process.cwd(), argument));
} catch (error: unknown) {
  console.error("\nErreur :", error instanceof Error ? error.message : String(error));
  process.exit(1);
}
