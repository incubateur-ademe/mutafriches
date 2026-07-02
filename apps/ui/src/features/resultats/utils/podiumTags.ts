import type {
  DonneesComplementairesInputDto,
  EnrichissementOutputDto,
  UsageResultat,
  UsageResultatDetaille,
} from "@mutafriches/shared-types";
import { getUsageInfo } from "./usagesLabels.utils";
import {
  generateTagsForUsage,
  getCritereTagLabel,
  SEUIL_POIDS_PONDERE_TAG,
  MAX_TAGS_PAR_USAGE,
  type TagInputData,
} from "./dynamicTags";

/**
 * Tags courts d'un usage pour le podium : d'abord les vrais avantages pondérés de
 * l'algorithme, sinon les tags dérivés des données d'entrée, sinon les tags statiques.
 * Fonction pure (réutilisée par PodiumCard et l'export PDF).
 */
export function getPodiumTags(
  result: UsageResultat,
  enrichmentData?: EnrichissementOutputDto,
  manualData?: DonneesComplementairesInputDto,
): string[] {
  const detailsCalcul = (result as UsageResultatDetaille).detailsCalcul;

  if (detailsCalcul?.detailsAvantages) {
    const tags = detailsCalcul.detailsAvantages
      // Exclure les critères NEUTRE (scoreBrut = 0.5) comptés des deux côtés
      .filter((c) => c.scoreBrut > 0.5)
      .filter((c) => c.scorePondere >= SEUIL_POIDS_PONDERE_TAG)
      .sort((a, b) => b.scorePondere - a.scorePondere)
      .slice(0, MAX_TAGS_PAR_USAGE)
      .map((c) => getCritereTagLabel(c.critere, c.valeur))
      .filter((label): label is string => label !== null);
    if (tags.length > 0) return tags;
  }

  if (enrichmentData && manualData) {
    const tagInputData: TagInputData = { enrichmentData, manualData };
    return generateTagsForUsage(result.usage, tagInputData).tags;
  }

  return getUsageInfo(result.usage).tags;
}
