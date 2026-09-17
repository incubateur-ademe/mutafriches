import type { PartnerConfig } from "../../core/types";
import { groupByCommune, groupByIdtup } from "../../core/group";
import { PARCELLES_PETR_SOLOGNE } from "./parcelles";

const sites = groupByIdtup(PARCELLES_PETR_SOLOGNE);

// TODO métier : faire confirmer par EODD le libellé exact du PETR et sa description.
// Défauts déduits de l'inventaire : les 14 communes sont toutes dans le Loiret et la colonne
// ORIGINE cite les EPCI CCF, CCL, CCPS et CCVS.
export const PETR_SOLOGNE_CONFIG: PartnerConfig = {
  slug: "petr-sologne",
  nom: "PETR Forêt d'Orléans-Loire-Sologne (45)",
  description:
    "Qualification et mutabilité des friches du PETR (Loiret), inventaire réalisé par EODD.",
  departement: "45",
  storageKey: "petr-sologne-custom-sites",
  sites,
  sitesByCommune: groupByCommune(sites),
};
