import { CanalIntegrateur } from "@mutafriches/shared-types";
import type { Integrateur } from "../../shared/database/schemas/integrateurs.schema";

export interface ReferentielsPublication {
  slugsPartenaires: string[];
  identifiantsIframe: string[];
}

export type ResultatPublication = { cleStats: string } | { erreur: string };

// Clé de statistiques d'une page ou d'une iframe à publier. La publication suit la mise en
// place technique (seed du partenaire, entrée du registre iframe déployée) : elle la vérifie.
export function cleStatsPublication(
  integrateur: Pick<Integrateur, "canal">,
  identifiant: string,
  referentiels: ReferentielsPublication,
): ResultatPublication {
  if (integrateur.canal === CanalIntegrateur.PAGE) {
    return referentiels.slugsPartenaires.includes(identifiant)
      ? { cleStats: `partenaire:${identifiant}` }
      : { erreur: `Aucun partenaire « ${identifiant} » en base : lancer d'abord le seed.` };
  }

  if (integrateur.canal === CanalIntegrateur.IFRAME) {
    return referentiels.identifiantsIframe.includes(identifiant)
      ? { cleStats: identifiant }
      : {
          erreur: `« ${identifiant} » est absent de INTEGRATEURS_IFRAME : ajouter l'entrée et déployer d'abord.`,
        };
  }

  return {
    erreur: "Seules une page ou une iframe se publient : API et QGIS sont actifs d'office.",
  };
}
