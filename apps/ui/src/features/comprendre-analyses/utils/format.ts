import type { CritereMatriceDoc } from "@mutafriches/shared-types";

export const formatPoids = (poids: number): string => poids.toLocaleString("fr-FR");

// Signe explicite sauf pour le neutre (0,5), compté à la fois en avantage et en contrainte
export const formatScore = (score: number): string => {
  const valeur = Math.abs(score).toLocaleString("fr-FR");
  if (score < 0) return `−${valeur}`;
  return score >= 1 ? `+${valeur}` : valeur;
};

export const formatEvolution = (
  critere: Pick<CritereMatriceDoc, "versionAjout" | "versionsModification">,
): string => {
  const parties = [critere.versionAjout];
  if (critere.versionsModification.length)
    parties.push(`modif. ${critere.versionsModification.join(", ")}`);
  return parties.join(" ; ");
};
