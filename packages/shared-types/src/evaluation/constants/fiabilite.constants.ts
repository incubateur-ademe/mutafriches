/**
 * Configuration des niveaux de fiabilité
 * Utilisé pour l'affichage et les tooltips dans l'UI
 */
export const NIVEAUX_FIABILITE = [
  {
    seuilMin: 9,
    text: "Très fiable",
    description: "Analyse complète avec toutes les données disponibles.",
  },
  {
    seuilMin: 7,
    text: "Fiable",
    description: "Données analysées avec un niveau de confiance élevé.",
  },
  {
    seuilMin: 5,
    text: "Moyennement fiable",
    description: "Analyse partielle, certaines données manquantes.",
  },
  {
    seuilMin: 3,
    text: "Peu fiable",
    description: "Données insuffisantes pour une analyse complète.",
  },
  {
    seuilMin: 0,
    text: "Très peu fiable",
    description: "Données très incomplètes, résultats indicatifs uniquement.",
  },
] as const;

/**
 * Type helper pour un niveau de fiabilité
 */
export type NiveauFiabilite = (typeof NIVEAUX_FIABILITE)[number];
