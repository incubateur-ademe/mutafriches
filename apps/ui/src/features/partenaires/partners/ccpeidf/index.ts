import type { PartnerConfig } from "../../core/types";
import { groupByCommune, groupByIdtup } from "../../core/group";
import { PARCELLES_CCPEIDF } from "./parcelles";

const sites = groupByIdtup(PARCELLES_CCPEIDF);

// TODO métier : faire confirmer par EODD le libellé développé de la CCPEIDF.
// Défaut déduit de l'inventaire : les 11 communes sont toutes en Eure-et-Loir.
export const CCPEIDF_CONFIG: PartnerConfig = {
  slug: "ccpeidf",
  nom: "CC des Portes Euréliennes d'Île-de-France (28)",
  description:
    "Qualification et mutabilité des friches de la CCPEIDF (Eure-et-Loir), inventaire réalisé par EODD.",
  departement: "28",
  storageKey: "ccpeidf-custom-sites",
  sites,
  sitesByCommune: groupByCommune(sites),
};
