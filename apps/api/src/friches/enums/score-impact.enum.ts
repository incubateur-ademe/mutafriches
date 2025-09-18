/**
 * Enum représentant les niveaux d'impact pour le calcul de mutabilité
 * Correspondance avec les valeurs Excel : Très négatif, Négatif, Neutre, Positif, Très positif
 */
export enum ScoreImpact {
  /** Très négatif - Impact très défavorable */
  TRES_NEGATIF = -2,

  /** Négatif - Impact défavorable */
  NEGATIF = -1,

  /** Neutre - Impact minimal */
  // Vu avec Anna, permet d'éviter le déclassement total d'un usage au regard du critère en question
  NEUTRE = 0.5,

  /** Positif - Impact favorable */
  POSITIF = 1,

  /** Très positif - Impact très favorable */
  TRES_POSITIF = 2,
}

/**
 * Type helper pour les valeurs de score acceptées
 */
export type ScoreValue = ScoreImpact | number;

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
