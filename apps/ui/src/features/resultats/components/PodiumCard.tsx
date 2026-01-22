import React, { useState } from "react";
import { UsageResultat } from "@mutafriches/shared-types";
import { getUsageInfo, getBadgeConfig } from "../utils/usagesLabels.utils";
import "./PodiumCard.css";

interface PodiumCardProps {
  result: UsageResultat;
}

export const PodiumCard: React.FC<PodiumCardProps> = ({ result }) => {
  const [showTags, setShowTags] = useState(false);
  const usageInfo = getUsageInfo(result.usage);
  const badgeConfig = getBadgeConfig(result.indiceMutabilite);

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
            {usageInfo.tags.map((tag, index) => (
              <a key={index} className="fr-tag fr-mt-2v" href="#">
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
