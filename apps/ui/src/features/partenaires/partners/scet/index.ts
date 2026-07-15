import type { PartnerConfig } from "../../core/types";
import { groupByCommune, groupByIdtup } from "../../core/group";
import { PARCELLES_SCET } from "./parcelles";

const sites = groupByIdtup(PARCELLES_SCET);

export const SCET_CONFIG: PartnerConfig = {
  slug: "scet",
  nom: "SCET – Banque des Territoires",
  description:
    "Qualification et mutabilité des friches de la CC du Pays de Montereau (77), inventaire du SCET (groupe Caisse des Dépôts).",
  departement: "77",
  storageKey: "scet-custom-sites",
  sites,
  sitesByCommune: groupByCommune(sites),
};
