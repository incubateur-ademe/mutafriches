/**
 * Liste de sites de référence à précharger dans la page de comparaison Cartofriches.
 *
 * Éditez ce tableau pour ajouter les sites à comparer. Chaque site peut être mono-parcelle
 * (un seul identifiant) ou multi-parcelle (plusieurs identifiants formant une même unité foncière).
 */
export interface SiteReference {
  /** Libellé indicatif (nom du site), affiché dans l'UI */
  label?: string;
  /** Identifiants cadastraux composant le site */
  parcelles: string[];
}

export const SITES_REFERENCE: SiteReference[] = [
  {
    label: "CAVAL (Coopérative agricole Vienne Anjou Loire) — Trélazé",
    parcelles: ["49353000AC0628"],
  },
  // Ajouter ici les autres sites de référence à comparer.
];
