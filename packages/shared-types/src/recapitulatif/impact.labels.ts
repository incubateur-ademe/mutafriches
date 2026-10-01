/** Niveau d'impact d'un critère sur un usage donné */
export type ImpactNiveau =
  "tres-positif" | "positif" | "neutre" | "negatif" | "tres-negatif" | "bloquant";

export interface ImpactCritere {
  label: string;
  niveau: ImpactNiveau;
}

// Critère ayant déclenché une règle d'exclusion de l'usage (v1.16) : prime sur le score
export const IMPACT_BLOQUANT: ImpactCritere = { label: "Bloquant", niveau: "bloquant" };

/**
 * Traduit le score brut d'un critère (ScoreImpact) en libellé + niveau d'impact.
 * Seuils : >=2 très positif, >=1 positif, ]0;1[ neutre, [-1;0[ négatif, <-1 très négatif.
 */
export function getImpactCritere(scoreBrut: number): ImpactCritere {
  if (scoreBrut >= 2) return { label: "Très positif", niveau: "tres-positif" };
  if (scoreBrut >= 1) return { label: "Positif", niveau: "positif" };
  if (scoreBrut > 0 && scoreBrut < 1) return { label: "Neutre", niveau: "neutre" };
  if (scoreBrut >= -1 && scoreBrut < 0) return { label: "Négatif", niveau: "negatif" };
  if (scoreBrut < -1) return { label: "Très négatif", niveau: "tres-negatif" };
  return { label: "Neutre", niveau: "neutre" };
}
