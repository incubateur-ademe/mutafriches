import { ScoreImpact } from "./criteres-scoring.config";

// Configuration des niveaux de fiabilité
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
 * Fonction helper pour convertir une chaîne Excel en ScoreImpact
 * @param value La valeur textuelle du Excel
 * @returns Le ScoreImpact correspondant
 */
export function excelToScoreImpact(value: string): ScoreImpact | null {
  const normalized = value.toLowerCase().trim();

  switch (normalized) {
    case "très négatif":
      return ScoreImpact.TRES_NEGATIF;
    case "négatif":
      return ScoreImpact.NEGATIF;
    case "neutre":
      return ScoreImpact.NEUTRE;
    case "positif":
      return ScoreImpact.POSITIF;
    case "très positif":
      return ScoreImpact.TRES_POSITIF;
    default:
      return null;
  }
}

/**
 * Fonction helper pour obtenir le label français d'un ScoreImpact
 * @param score Le score à convertir
 * @returns Le label en français
 */
export function scoreImpactToLabel(score: ScoreImpact): string {
  switch (score) {
    case ScoreImpact.TRES_NEGATIF:
      return "très négatif";
    case ScoreImpact.NEGATIF:
      return "négatif";
    case ScoreImpact.NEUTRE:
      return "neutre";
    case ScoreImpact.POSITIF:
      return "positif";
    case ScoreImpact.TRES_POSITIF:
      return "très positif";
    default:
      return "inconnu";
  }
}
