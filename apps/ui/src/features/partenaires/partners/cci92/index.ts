import type { PartnerConfig } from "../../core/types";
import { groupByCommune, groupByIdtup } from "../../core/group";
import { PARCELLES_CCI92 } from "./parcelles";

const sites = groupByIdtup(PARCELLES_CCI92);

export const CCI92_CONFIG: PartnerConfig = {
  slug: "cci-92",
  nom: "CCI Hauts-de-Seine (92)",
  description:
    "POC de qualification et mutabilité des friches sur le territoire de la CCI 92 (Colombes, Gennevilliers, Nanterre).",
  departement: "92",
  storageKey: "cci92-custom-sites",
  sites,
  sitesByCommune: groupByCommune(sites),
};
