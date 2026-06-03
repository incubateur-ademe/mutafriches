import type { PartnerParcelle } from "../../core/types";

// TODO(aura) : données PLACEHOLDER en attendant la liste réelle d'AURA (cf. mail partenaire).
// Deux catégories ci-dessous :
//   1. SITE DE TEST : IDU RÉELS et fonctionnels (parcelles de Besançon, exemple de référence du
//      repo) — uniquement pour valider le flux enrichissement -> mutabilité de bout en bout.
//      À SUPPRIMER une fois les vrais sites d'AURA intégrés.
//   2. Sites Angevins : IDU FICTIFS (format valide 14 car.) — l'enrichissement échouera dessus,
//      ils ne servent qu'à visualiser la liste. À remplacer par les vrais IDU du Maine-et-Loire.
// Tant que les vrais IDU ne sont pas en place, NE PAS ajouter AURA au registre de prefetch CI
// (apps/api/src/scripts/partenaires/registry.ts).
export const PARCELLES_AURA: PartnerParcelle[] = [
  // 1. SITES DE TEST — IDU réels (Besançon) pour tester le flux complet. TODO(aura) : retirer.
  { idpar: "25056000HZ0346", commune: "SITE DE TEST", idtup: "25056000HZ0346" },
  { idpar: "25056000HZ0346", commune: "SITE DE TEST (multi)", idtup: "ufAURATEST01" },
  { idpar: "25056000HZ0347", commune: "SITE DE TEST (multi)", idtup: "ufAURATEST01" },

  // 2. Sites angevins — placeholder fictif. TODO(aura) : remplacer par les vrais IDU.
  { idpar: "490070000A0001", commune: "ANGERS", idtup: "490070000A0001" },
  { idpar: "490070000A0002", commune: "ANGERS", idtup: "490070000A0002" },
  { idpar: "493530000B0001", commune: "TRELAZE", idtup: "ufAURA000001" },
  { idpar: "493530000B0002", commune: "TRELAZE", idtup: "ufAURA000001" },
  { idpar: "490150000C0001", commune: "AVRILLE", idtup: "490150000C0001" },
];
