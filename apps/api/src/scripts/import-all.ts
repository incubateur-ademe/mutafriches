/* eslint-disable no-console */
/**
 * Lance les imports de référentiels dont la table est vide, un par un (ADR-0050).
 *
 * Usage :
 *   pnpm db:import:all                      # importe seulement ce qui manque
 *   pnpm db:import:all --force=qpv,zae      # réimporte ces référentiels même présents
 *   pnpm db:import:all --only=icu           # ne traite que ce référentiel
 *   pnpm db:import:all --strict             # code de sortie 1 si un import échoue
 *
 * Appelé par le `postdeploy` (Procfile), après les migrations. Par défaut, un échec n'empêche
 * pas le déploiement : il est loggué en fin d'exécution et la table reste vide, ce que signalent
 * `GET /donnees-externes/imports` et l'alerte « référentiel VIDE » des repositories.
 *
 * Source de vérité : `IMPORT_DATASETS` (donnees-externes/imports.registry.ts). Les scripts sont
 * lancés depuis leur version compilée, voisine de celle-ci dans `dist/src/scripts`.
 */

import { spawnSync } from "child_process";
import * as path from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { getAppConfig } from "../config";
import { IMPORT_DATASETS } from "../donnees-externes/imports.registry";
import {
  codeSortie,
  DependancesImportAll,
  importerTout,
  parserOptions,
  ResultatImport,
} from "./import-all/import-all.core";

const LIGNES_SORTIE_CONSERVEES = 15;

function derniereLignes(texte: string): string {
  // Les scripts affichent leur progression avec des retours chariot : on garde la fin utile.
  const lignes = texte.split(/[\r\n]+/).filter((l) => l.trim() !== "");
  return lignes.slice(-LIGNES_SORTIE_CONSERVEES).join("\n");
}

function lancerScript(script: string): ReturnType<DependancesImportAll["lancerScript"]> {
  const debut = Date.now();
  const resultat = spawnSync(process.execPath, [path.resolve(__dirname, `${script}.js`)], {
    encoding: "utf-8",
    maxBuffer: 256 * 1024 * 1024,
  });
  const sortie = derniereLignes(`${resultat.stdout ?? ""}\n${resultat.stderr ?? ""}`);
  return { ok: resultat.status === 0, sortie, dureeMs: Date.now() - debut };
}

function afficherRecapitulatif(resultats: ResultatImport[]): void {
  const etiquettes = { importe: "IMPORTÉ", ignore: "IGNORÉ ", echec: "ÉCHEC  " } as const;
  console.log("\n" + "=".repeat(60));
  console.log("Récapitulatif des imports");
  console.log("=".repeat(60));
  for (const r of resultats) {
    console.log(`[${etiquettes[r.statut]}] ${r.key} (${r.source}) : ${r.detail}`);
  }
  const echecs = resultats.filter((r) => r.statut === "echec");
  if (echecs.length > 0) {
    console.error(
      `\n${echecs.length} import(s) en échec : ${echecs.map((r) => r.key).join(", ")}. ` +
        "Les tables concernées restent vides ; relancer `pnpm db:import:all`.",
    );
  }
}

async function main(): Promise<void> {
  const options = parserOptions(
    process.argv.slice(2),
    IMPORT_DATASETS.map((d) => d.key),
  );

  const client = postgres(getAppConfig().database);
  const db = drizzle(client);

  try {
    const resultats = await importerTout(IMPORT_DATASETS, options, {
      compterLignes: async (table: string): Promise<number> => {
        const lignes = (await db.execute<{ total: number }>(
          sql`SELECT COUNT(*)::int AS total FROM ${sql.identifier(table)}`,
        )) as unknown as Array<{ total: number }>;
        return lignes[0]?.total ?? 0;
      },
      lancerScript: (script: string) => {
        console.log(`\nImport ${script}...`);
        return lancerScript(script);
      },
    });

    afficherRecapitulatif(resultats);
    process.exitCode = codeSortie(resultats, options.strict);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("\nErreur :", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
