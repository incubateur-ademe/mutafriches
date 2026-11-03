/* eslint-disable no-console */
/**
 * Peuple la table attributaire depuis les données en base (ADR-0053). Aucun appel externe :
 * un site sans enrichissement en base est signalé, pas enrichi.
 *
 * Usage :
 *   pnpm attributaire:peupler                    # tout le périmètre (sites évalués + partenaires)
 *   pnpm attributaire:peupler --commune=77305    # une commune
 *   pnpm attributaire:peupler --dry-run          # calcule sans écrire
 *   pnpm attributaire:peupler --si-necessaire    # postdeploy : tout si la table est vide,
 *                                                # sinon les lignes d'une ancienne version d'algo
 *
 * En `--si-necessaire`, une erreur ne fait jamais échouer le déploiement.
 */

import { DatabaseService } from "../shared/database/database.service";
import { CalculService } from "../evaluation/services/calcul.service";
import { FiabiliteCalculator } from "../evaluation/services/algorithme/fiabilite.calculator";
import { AttributaireService } from "../attributaire/attributaire.service";
import { AttributaireRepository } from "../attributaire/repositories/attributaire.repository";
import { SourcesAttributaireRepository } from "../attributaire/repositories/sources-attributaire.repository";
import {
  parserOptions,
  peupler,
  type BilanPeuplement,
} from "./attributaire/peupler-attributaire.core";

const ECARTES_AFFICHES = 30;

function afficherBilan(bilan: BilanPeuplement, dryRun: boolean): void {
  console.log("\n" + "=".repeat(60));
  console.log(`Table attributaire : mode ${bilan.mode}${dryRun ? " (dry-run, rien d'écrit)" : ""}`);
  console.log("=".repeat(60));
  console.log(`Sites traités       : ${bilan.traites}`);
  console.log(`À jour              : ${bilan.parStatut["a-jour"]}`);
  console.log(`Hors périmètre      : ${bilan.parStatut["hors-perimetre"]}`);
  console.log(`Sans enrichissement : ${bilan.parStatut["sans-enrichissement"]}`);
  console.log(`Écartés             : ${bilan.parStatut.ecarte}`);
  console.log(`Erreurs             : ${bilan.parStatut.erreur}`);

  for (const { cle, motif } of bilan.ecartes.slice(0, ECARTES_AFFICHES)) {
    console.log(`  - ${cle} : ${motif}`);
  }
  if (bilan.ecartes.length > ECARTES_AFFICHES) {
    console.log(`  ... et ${bilan.ecartes.length - ECARTES_AFFICHES} autres`);
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const options = parserOptions(argv);

  const database = new DatabaseService();
  database.onModuleInit();

  try {
    const service = new AttributaireService(
      new SourcesAttributaireRepository(database),
      new AttributaireRepository(database),
      new CalculService(new FiabiliteCalculator()),
    );

    const bilan = await peupler(
      options,
      {
        compter: () => service.compter(),
        listerPerimetre: (codeInsee) => service.listerPerimetre(codeInsee),
        listerHorsVersionCourante: () => service.listerHorsVersionCourante(),
        rafraichir: (parcelles) => service.rafraichir(parcelles, { enregistrer: !options.dryRun }),
      },
      (traites, total) => {
        if (traites % 100 === 0 || traites === total) {
          process.stdout.write(`\r${traites}/${total} sites`);
        }
      },
    );

    afficherBilan(bilan, options.dryRun);
  } finally {
    await database.onModuleDestroy();
  }
}

main().catch((error: unknown) => {
  console.error("\nErreur :", error instanceof Error ? error.message : String(error));
  // Le postdeploy ne doit pas échouer pour une table recalculable à la main
  process.exit(process.argv.includes("--si-necessaire") ? 0 : 1);
});
