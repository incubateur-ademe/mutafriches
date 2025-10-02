import React, { useState } from "react";
import { getUsageInfo } from "../../utils/mappers/usages.mapper";
import { UsageResultat } from "@mutafriches/shared-types";
import { useEventTracking } from "../../hooks/useEventTracking";

interface PodiumCardProps {
  result: UsageResultat;
  position: 1 | 2 | 3;
  evaluationId?: string;
}

/**
 * Carte pour afficher un usage dans le podium (top 3)
 */
export const PodiumCard: React.FC<PodiumCardProps> = ({ result, position, evaluationId }) => {
  // Informations sur l'usage
  const usageInfo = getUsageInfo(result.usage);

  const { trackInteretMiseEnRelation } = useEventTracking();

  // State pour éviter les clics multiples
  const [trackingEnvoye, setTrackingEnvoye] = useState(false);

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

  // Handler pour le clic
  const handleRencontrerPorteurs = async () => {
    // Track seulement la première fois
    if (!trackingEnvoye && evaluationId) {
      await trackInteretMiseEnRelation(evaluationId, result.usage);
      setTrackingEnvoye(true);
    }

    alert(
      "Fonctionnalité à venir ! Vous serez bientôt mis en relation avec des porteurs de projets.",
    );
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

          <div className="fr-card__content text-center">
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
          <div className="fr-card__footer text-center">
            <button
              type="button"
              onClick={handleRencontrerPorteurs}
              className="fr-align fr-btn fr-btn--sm fr-btn--secondary"
            >
              Rencontrer des porteurs de projets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
