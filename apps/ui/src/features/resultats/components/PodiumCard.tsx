import React, { useMemo } from "react";
import {
  UsageResultat,
  EnrichissementOutputDto,
  DonneesComplementairesInputDto,
} from "@mutafriches/shared-types";
import { getUsageInfo, getBadgeConfig } from "../utils/usagesLabels.utils";
import { getPodiumTags } from "../utils/podiumTags";
import "./PodiumCard.css";

interface PodiumCardProps {
  result: UsageResultat;
  enrichmentData?: EnrichissementOutputDto;
  manualData?: DonneesComplementairesInputDto;
}

export const PodiumCard: React.FC<PodiumCardProps> = ({ result, enrichmentData, manualData }) => {
  const usageInfo = getUsageInfo(result.usage);
  const badgeConfig = getBadgeConfig(result.indiceMutabilite);

  const dynamicTags = useMemo(
    () => getPodiumTags(result, enrichmentData, manualData),
    [result, enrichmentData, manualData],
  );

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

        {/* Tags affichés directement */}
        <div className="fr-tags-group fr-tags-group--sm fr-mb-2w fr-mt-2w">
          {dynamicTags.map((tag, index) => (
            <p key={index} className="fr-tag fr-mt-2v">
              {tag}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};
