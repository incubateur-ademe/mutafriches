import type { PartnerConfig } from "../../core/types";
import { groupByCommune, groupByIdtup } from "../../core/group";
import { PARCELLES_AURA } from "./parcelles";

// TODO(aura) : configuration PLACEHOLDER. Valider les libellés (nom, description, sous-titre)
// avec AURA. Retirer la mention « données provisoires » une fois les vrais sites intégrés.
const sites = groupByIdtup(PARCELLES_AURA);

export const AURA_CONFIG: PartnerConfig = {
  slug: "aura", // → /partenaires/aura
  nom: "AURA — Agence d'urbanisme de la région angevine",
  description:
    "POC de qualification et mutabilité des friches sur le territoire d'AURA (données provisoires).",
  sousTitre: "Qualification et mutabilité des friches sur le territoire d'AURA.",
  sidemenuTitre: "Sites AURA",
  storageKey: "aura-custom-sites",
  sites,
  sitesByCommune: groupByCommune(sites),
};
