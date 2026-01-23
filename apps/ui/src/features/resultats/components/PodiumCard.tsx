import React, { useState, useMemo } from "react";
import {
  UsageResultat,
  EnrichissementOutputDto,
  DonneesComplementairesInputDto,
} from "@mutafriches/shared-types";
import { getUsageInfo, getBadgeConfig } from "../utils/usagesLabels.utils";
import { generateTagsForUsage } from "../utils/dynamicTags.resolver";
import { TagInputData } from "../utils/dynamicTags.types";
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

  // Génération des tags dynamiques basés sur les données d'entrée
  const dynamicTags = useMemo(() => {
    if (!enrichmentData || !manualData) {
      // Fallback sur les tags statiques si les données ne sont pas disponibles
      return usageInfo.tags;
    }

    const tagInputData: TagInputData = {
      enrichmentData,
      manualData,
    };

    const { tags } = generateTagsForUsage(result.usage, tagInputData);
    return tags;
  }, [enrichmentData, manualData, result.usage, usageInfo.tags]);

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
