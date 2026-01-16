import React from "react";
import { UsageResultat } from "@mutafriches/shared-types";
import { getUsageInfo, getBadgeConfig, sortTagsForDisplay } from "../utils/usagesLabels.utils";
import "./PodiumCard.css";

interface PodiumCardProps {
  result: UsageResultat;
}

export const PodiumCard: React.FC<PodiumCardProps> = ({ result }) => {
  const usageInfo = getUsageInfo(result.usage);
  const badgeConfig = getBadgeConfig(result.indiceMutabilite);
  const sortedTags = sortTagsForDisplay(usageInfo.tags);

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

        {/* Tags - 2 premiers (courts) sur ligne 1, dernier (long) sur ligne 2 */}
        <div className="podium-card__tags fr-mb-2w fr-mt-2w">
          <div className="podium-card__tags-row">
            {sortedTags.slice(0, 2).map((tag, index) => (
              <a key={index} className="fr-tag fr-mb-2v" href="#">
                {tag}
              </a>
            ))}
          </div>
          {sortedTags.length > 2 && (
            <div className="podium-card__tags-row">
              <a className="fr-tag" href="#">
                {sortedTags[2]}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
