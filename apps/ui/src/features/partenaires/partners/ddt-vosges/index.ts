import type { PartnerConfig } from "../../core/types";
import { groupByCommune, groupByIdtup } from "../../core/group";
import { PARCELLES_DDT_VOSGES } from "./parcelles";

const sites = groupByIdtup(PARCELLES_DDT_VOSGES);

export const DDT_VOSGES_CONFIG: PartnerConfig = {
  slug: "ddt-vosges",
  nom: "DDT des Vosges (88)",
  description:
    "Qualification et mutabilité des friches du département des Vosges, base de la DDT 88.",
  departement: "88",
  storageKey: "ddt-vosges-custom-sites",
  sites,
  sitesByCommune: groupByCommune(sites),
};
