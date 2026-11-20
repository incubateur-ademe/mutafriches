/* eslint-disable no-console */
/**
 * Reprend dans la table `integrateurs` les intégrateurs antérieurs au registre (ADR-0055) :
 * origines de ALLOWED_INTEGRATOR_ORIGINS, registre iframe du code et pages partenaires.
 * Idempotent : une ligne déjà présente n'est ni recréée ni modifiée.
 *
 * Usage :
 *   pnpm integrateurs:synchroniser
 *
 * Lancé par le postdeploy, avant le démarrage de la nouvelle version. Une erreur fait
 * échouer le déploiement : démarrer avec un registre vide refuserait tous les intégrateurs.
 */

import { INTEGRATEURS_IFRAME } from "@mutafriches/shared-types";
import { getAppConfig } from "../config";
import { DatabaseService } from "../shared/database/database.service";
import { IntegrateurRepository } from "../integrateurs/repositories/integrateur.repository";
import { PartenaireRepository } from "../partenaires/repositories/partenaire.repository";
import { construireLignesReprise } from "./integrateurs/reprise-integrateurs.core";

async function main(): Promise<void> {
  const database = new DatabaseService();
  database.onModuleInit();

  try {
    const repository = new IntegrateurRepository(database);
    const partenaires = await new PartenaireRepository(database).findAll();

    const lignes = construireLignesReprise({
      originesVariable: getAppConfig().origins.allowedIntegrators,
      integrateursIframe: INTEGRATEURS_IFRAME,
      partenaires,
    });

    let creees = 0;
    for (const ligne of lignes) {
      const creee = await repository.creerSiAbsent(ligne);
      if (creee) {
        creees += 1;
        console.log(`  + ${creee.canal} : ${creee.structure} (${creee.cleStats ?? creee.origine})`);
      }
    }

    console.log(
      `Registre des intégrateurs : ${creees} ligne(s) créée(s), ${lignes.length - creees} déjà présente(s)`,
    );

    // Une origine écartée par une contrainte d'unicité perdrait son accès sans bruit.
    const absentes: string[] = [];
    for (const ligne of lignes) {
      if (
        ligne.origine &&
        !(await repository.trouverParCanalEtOrigine(ligne.canal, ligne.origine))
      ) {
        absentes.push(`${ligne.canal} ${ligne.origine}`);
      }
    }
    if (absentes.length > 0) {
      throw new Error(`origines non reprises : ${absentes.join(", ")}`);
    }
  } finally {
    await database.onModuleDestroy();
  }
}

main().catch((error: unknown) => {
  console.error("Reprise des intégrateurs en échec :", (error as Error).message);
  process.exit(1);
});
