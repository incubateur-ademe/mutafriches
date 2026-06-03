import type { PartnerParcelle } from "../../core/types";

// TODO(aura) : données PLACEHOLDER — IDU fictifs (mais au format valide 14 caractères) en
// attendant la liste réelle d'AURA (cf. mail partenaire). Remplacer par les vrais identifiants
// cadastraux du Maine-et-Loire (49). Tant que ces IDU sont fictifs, NE PAS ajouter AURA au
// registre de prefetch CI (apps/api/src/scripts/partenaires/registry.ts) : les appels
// d'enrichissement échoueraient sur des parcelles inexistantes.
export const PARCELLES_AURA: PartnerParcelle[] = [
  // Sites mono-parcelle (placeholder) — Angers (INSEE 49007)
  { idpar: "490070000A0001", commune: "ANGERS", idtup: "490070000A0001" },
  { idpar: "490070000A0002", commune: "ANGERS", idtup: "490070000A0002" },
  // Site multi-parcelles (placeholder) — Trélazé (INSEE 49353) : même idtup = une unité foncière
  { idpar: "493530000B0001", commune: "TRELAZE", idtup: "ufAURA000001" },
  { idpar: "493530000B0002", commune: "TRELAZE", idtup: "ufAURA000001" },
  // Site mono-parcelle (placeholder) — Avrillé (INSEE 49015)
  { idpar: "490150000C0001", commune: "AVRILLE", idtup: "490150000C0001" },
];
