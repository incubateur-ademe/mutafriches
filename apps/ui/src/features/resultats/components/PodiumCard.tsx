import React from "react";
import { UsageResultat } from "@mutafriches/shared-types";
import { getUsageInfo } from "../utils/usagesLabels.utils";

interface PodiumCardProps {
  result: UsageResultat;
  position: 1 | 2 | 3;
  evaluationId?: string;
}

export const PodiumCard: React.FC<PodiumCardProps> = ({ result, position }) => {
  const usageInfo = getUsageInfo(result.usage);

  const getPositionStyles = () => {
    switch (position) {
      case 1:
        return {
          badge: "fr-badge--success",
          color: "#18753c",
          icon: "🥇",
          potentiel: "Excellent",
        };
      case 2:
        return {
          badge: "fr-badge--info",
          color: "#0078f3",
          icon: "🥈",
          potentiel: "Très bon",
        };
      case 3:
        return {
          badge: "",
          color: "#666666",
          icon: "🥉",
          potentiel: "Bon",
        };
    }
  };

  const styles = getPositionStyles();

  return (
    <>
      <div className="fr-col-12 fr-col-md-4">
        <div className="fr-card fr-card--shadow">
          <div className="fr-card__body">
            <div style={{ textAlign: "left" }}>
              <p
                className={`fr-badge ${styles.badge} fr-badge--no-icon fr-badge--sm fr-mt-2w fr-mb-2w`}
              >
                {styles.icon} {styles.potentiel}
              </p>
            </div>

            <div className="fr-card__content text-center">
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{usageInfo.icon}</div>
              <h5 className="fr-card__title fr-mt-2w fr-mb-2w">{usageInfo.label}</h5>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
