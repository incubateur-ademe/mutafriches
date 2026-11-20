/* eslint-disable no-console */
/**
 * Exploitation du registre des intégrateurs (table `integrateurs`, ADR-0055).
 *
 * Usage :
 *   pnpm integrateurs:lister
 *   pnpm integrateurs:publier <id> <slug partenaire | identifiant iframe>
 *   pnpm integrateurs:revoquer <id>
 *   pnpm integrateurs:reactiver <id>
 *
 * Une révocation ou une réactivation prend effet en une minute au plus (cache du registre).
 */

import { INTEGRATEURS_IFRAME, StatutIntegrateur } from "@mutafriches/shared-types";
import { DatabaseService } from "../shared/database/database.service";
import { IntegrateurRepository } from "../integrateurs/repositories/integrateur.repository";
import { PartenaireRepository } from "../partenaires/repositories/partenaire.repository";
import { cleStatsPublication } from "./integrateurs/gestion-integrateurs.core";

async function lister(repository: IntegrateurRepository): Promise<void> {
  const lignes = await repository.lister();
  console.table(
    lignes.map((ligne) => ({
      id: ligne.id,
      canal: ligne.canal,
      structure: ligne.structure,
      origine: ligne.origine ?? "",
      cle_stats: ligne.cleStats ?? "",
      statut: ligne.statut,
      contact: ligne.contactEnregistre ? "oui" : "non",
    })),
  );
}

async function publier(
  database: DatabaseService,
  repository: IntegrateurRepository,
  id: string,
  identifiant: string,
): Promise<void> {
  const integrateur = await repository.trouverParId(id);
  if (!integrateur) {
    throw new Error(`Intégrateur ${id} introuvable`);
  }

  const partenaires = await new PartenaireRepository(database).findAll();
  const resultat = cleStatsPublication(integrateur, identifiant, {
    slugsPartenaires: partenaires.map((partenaire) => partenaire.slug),
    identifiantsIframe: Object.keys(INTEGRATEURS_IFRAME),
  });
  if ("erreur" in resultat) {
    throw new Error(resultat.erreur);
  }

  await repository.publier(id, resultat.cleStats);
  console.log(`${integrateur.structure} publié : cle_stats = ${resultat.cleStats}`);
}

async function changerStatut(
  repository: IntegrateurRepository,
  id: string,
  statut: StatutIntegrateur,
): Promise<void> {
  const integrateur = await repository.changerStatut(id, statut);
  if (!integrateur) {
    throw new Error(`Intégrateur ${id} introuvable`);
  }
  console.log(`${integrateur.structure} (${integrateur.canal}) : statut ${integrateur.statut}`);
}

async function main(): Promise<void> {
  const [commande, id, identifiant] = process.argv.slice(2);
  const database = new DatabaseService();
  database.onModuleInit();

  try {
    const repository = new IntegrateurRepository(database);

    if (commande === "lister") {
      await lister(repository);
    } else if (commande === "publier" && id && identifiant) {
      await publier(database, repository, id, identifiant);
    } else if (commande === "revoquer" && id) {
      await changerStatut(repository, id, StatutIntegrateur.REVOQUE);
    } else if (commande === "reactiver" && id) {
      await changerStatut(repository, id, StatutIntegrateur.ACTIF);
    } else {
      throw new Error(
        "Usage : lister | publier <id> <identifiant> | revoquer <id> | reactiver <id>",
      );
    }
  } finally {
    await database.onModuleDestroy();
  }
}

main().catch((error: unknown) => {
  console.error("Erreur :", (error as Error).message);
  process.exit(1);
});
