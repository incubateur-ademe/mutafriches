import React, { useState, useMemo } from "react";
import {
  UsageResultat,
  UsageResultatDetaille,
  EnrichissementOutputDto,
  DonneesComplementairesInputDto,
} from "@mutafriches/shared-types";
import { getUsageInfo, getBadgeConfig } from "../utils/usagesLabels.utils";
import {
  generateTagsForUsage,
  getCritereTagLabel,
  SEUIL_POIDS_PONDERE_TAG,
  MAX_TAGS_PAR_USAGE,
} from "../utils/dynamicTags";
import type { TagInputData } from "../utils/dynamicTags";
import "./PodiumCard.css";

interface PodiumCardProps {
  result: UsageResultat;
  enrichmentData?: EnrichissementOutputDto;
  manualData?: DonneesComplementairesInputDto;
}

export const PodiumCard: React.FC<PodiumCardProps> = ({ result, enrichmentData, manualData }) => {
  const [showTags, setShowTags] = useState(false);
  const usageInfo = getUsageInfo(result.usage);
  const badgeConfig = getBadgeConfig(result.indiceMutabilite);

  // Génération des tags basés sur les avantages pondérés de l'algorithme
  const dynamicTags = useMemo(() => {
    const detaille = result as UsageResultatDetaille;
    const detailsCalcul = detaille.detailsCalcul;


    // Si les données détaillées sont disponibles, utiliser les vrais avantages de l'algo
    if (detailsCalcul?.detailsAvantages) {
      const tags = detailsCalcul.detailsAvantages
        // Exclure les critères NEUTRE (scoreBrut = 0.5) qui comptent dans avantages ET contraintes
        .filter((c) => c.scoreBrut > 0.5)
        // Filtrer par seuil de poids pondéré
        .filter((c) => c.scorePondere >= SEUIL_POIDS_PONDERE_TAG)
        // Trier par poids pondéré décroissant
        .sort((a, b) => b.scorePondere - a.scorePondere)
        // Limiter le nombre de tags
        .slice(0, MAX_TAGS_PAR_USAGE)
        // Convertir en label court lisible
        .map((c) => getCritereTagLabel(c.critere, c.valeur))
        .filter((label): label is string => label !== null);

      if (tags.length > 0) return tags;
    }

    // Fallback sur les tags dynamiques basés sur les données d'entrée
    if (enrichmentData && manualData) {
      const tagInputData: TagInputData = { enrichmentData, manualData };
      const { tags } = generateTagsForUsage(result.usage, tagInputData);
      return tags;
    }

    // Fallback sur les tags statiques
    return usageInfo.tags;
  }, [result, enrichmentData, manualData, usageInfo.tags]);

  const handleToggleTags = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowTags(!showTags);
  };

  return (
    <div className="fr-col-12 fr-col-md-4">
      <div className="podium-card">
        {/* Badge */}
        <div
          className="podium-card__badge"
          style={{
            color: badgeConfig.textColor,
            backgroundColor: badgeConfig.backgroundColor,
          }}
        >
          {badgeConfig.label}
        </div>

        {/* Image */}
        <div className="podium-card__image">
          <img src={usageInfo.image} alt={usageInfo.label} />
        </div>

        {/* Titre */}
        <h5 className="podium-card__title">{usageInfo.label}</h5>

        {/* Tags ou lien "En savoir plus" */}
        {showTags ? (
          <div className="fr-tags-group fr-tags-group--sm fr-mb-2w fr-mt-2w">
            {dynamicTags.map((tag, index) => (
              <a href="#" key={index} className="fr-tag fr-mt-2v">
                {tag}
              </a>
            ))}
          </div>
        ) : (
          <a href="#" className="fr-link fr-mt-2w fr-mb-4w" onClick={handleToggleTags}>
            En savoir plus
          </a>
        )}
      </div>
    </div>
  );
};
