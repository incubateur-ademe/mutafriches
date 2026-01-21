import React from "react";
import { UsageResultat } from "@mutafriches/shared-types";
import { getUsageInfo, getBadgeConfig } from "../utils/usagesLabels.utils";
import "./PodiumCard.css";

interface PodiumCardProps {
  result: UsageResultat;
}

export const PodiumCard: React.FC<PodiumCardProps> = ({ result }) => {
  const usageInfo = getUsageInfo(result.usage);
  const badgeConfig = getBadgeConfig(result.indiceMutabilite);

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

        {/* Tags - affichage de tous les tags */}
        <div className="fr-tags-group fr-tags-group--sm fr-mb-2w fr-mt-2w">
          {usageInfo.tags.map((tag, index) => (
            <a key={index} className="fr-tag" href="#">
              {tag}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
