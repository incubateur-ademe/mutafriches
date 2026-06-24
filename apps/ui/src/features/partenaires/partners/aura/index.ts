import type { PartnerConfig } from "../../core/types";
import { groupByCommune, groupByIdtup } from "../../core/group";
import { PARCELLES_AURA } from "./parcelles";

const sites = groupByIdtup(PARCELLES_AURA);

export const AURA_CONFIG: PartnerConfig = {
  slug: "aura", // → /partenaires/aura
  nom: "AURA — Agence d'urbanisme de la région angevine",
  description:
    "Qualification et mutabilité des friches sur le territoire de l'AURA (Maine-et-Loire).",
  sousTitre: "Qualification et mutabilité des friches sur le territoire d'AURA.",
  sidemenuTitre: "Sites AURA",
  storageKey: "aura-custom-sites",
  sites,
  sitesByCommune: groupByCommune(sites),
};
