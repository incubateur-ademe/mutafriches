import type { PartnerConfig } from "../../core/types";
import { groupByCommune, groupByIdtup } from "../../core/group";
import { PARCELLES_AURA } from "./parcelles";

const sites = groupByIdtup(PARCELLES_AURA);

export const AURA_CONFIG: PartnerConfig = {
  slug: "aura",
  nom: "Agence d'urbanisme de la région angevine",
  description:
    "Qualification et mutabilité des friches sur le territoire de l'AURA (Maine-et-Loire).",
  departement: "49",
  storageKey: "aura-custom-sites",
  sites,
  sitesByCommune: groupByCommune(sites),
};
