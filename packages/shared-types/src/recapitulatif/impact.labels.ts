/** Niveau d'impact d'un critère sur un usage donné */
export type ImpactNiveau = "tres-positif" | "positif" | "neutre" | "negatif" | "tres-negatif";

export interface ImpactCritere {
  label: string;
  niveau: ImpactNiveau;
}

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
