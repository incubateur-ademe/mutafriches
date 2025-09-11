import React from "react";
import { UsageResultDto } from "@mutafriches/shared-types";
import { getUsageInfo } from "../../utils/mappers/usages.mapper";

interface PodiumCardProps {
  result: UsageResultDto;
  position: 1 | 2 | 3;
}

/**
 * Carte pour afficher un usage dans le podium (top 3)
 */
export const PodiumCard: React.FC<PodiumCardProps> = ({ result, position }) => {
  // Informations sur l'usage
  const usageInfo = getUsageInfo(result.usage);

  // Déterminer les styles selon la position
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
    <div className="fr-col-12 fr-col-md-4">
      <div className="fr-card fr-card--shadow">
        <div className="fr-card__body">
          {/* Badge position */}
          <div style={{ textAlign: "left" }}>
            <p
              className={`fr-badge ${styles.badge} fr-badge--no-icon fr-badge--sm fr-mt-2w fr-mb-2w`}
            >
              {styles.icon} {styles.potentiel}
            </p>
          </div>

          <div className="fr-card__content fr-text--center" style={{ textAlign: "center" }}>
            {/* Icône usage */}
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{usageInfo.icon}</div>

            {/* Titre usage */}
            <h5 className="fr-card__title fr-mt-2w fr-mb-2w">{usageInfo.label}</h5>

            {/* Badge pourcentage */}
            <h3
              className="fr-card__desc fr-mb-2w"
              style={{
                fontSize: "1.05rem",
                fontWeight: "bold",
                color: styles.color,
              }}
            >
              {result.indiceMutabilite}% de compatibilité
            </h3>

            {/* Description (placeholder pour l'instant) */}
            <p className="fr-card__desc fr-text--sm fr-mb-3w">
              Potentiel {styles.potentiel.toLowerCase()} pour cet usage selon les caractéristiques
              du site.
            </p>
          </div>

          {/* Actions */}
          <div className="fr-card__footer fr-text--center">
            <button type="button" className="fr-btn fr-btn--sm fr-btn--secondary">
              Rencontrer des porteurs de projets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
