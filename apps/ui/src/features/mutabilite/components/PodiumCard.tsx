import React, { useState } from "react";
import { UsageResultat } from "@mutafriches/shared-types";
import { getUsageInfo } from "../utils/usagesLabels.utils";
import { useEventTracking } from "../../../shared/hooks/useEventTracking";
import { ModalInfo } from "../../../shared/components/common/ModalInfo";

interface PodiumCardProps {
  result: UsageResultat;
  position: 1 | 2 | 3;
  evaluationId?: string;
}

export const PodiumCard: React.FC<PodiumCardProps> = ({ result, position, evaluationId }) => {
  const usageInfo = getUsageInfo(result.usage);
  const { trackInteretMiseEnRelation } = useEventTracking();

  const [trackingEnvoye, setTrackingEnvoye] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleRencontrerPorteurs = async () => {
    if (!trackingEnvoye && evaluationId) {
      await trackInteretMiseEnRelation(evaluationId, result.usage);
      setTrackingEnvoye(true);
    }
    setIsModalOpen(true);
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

              <p className="fr-card__desc fr-text--sm fr-mb-3w">
                Potentiel {styles.potentiel.toLowerCase()} pour cet usage selon les caractéristiques
                du site.
              </p>
            </div>

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

      <ModalInfo
        id={`modal-porteurs-${result.usage}`}
        title="Fonctionnalité à venir"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        icon="fr-icon-calendar-event-line"
      >
        <p>
          Vous serez bientôt mis en relation avec des porteurs de projets pour l'usage{" "}
          <strong>{usageInfo.label}</strong>.
        </p>
        <p className="fr-text--sm">
          Cette fonctionnalité permettra de faciliter la rencontre entre propriétaires de friches et
          acteurs souhaitant développer des projets.
        </p>
      </ModalInfo>
    </>
  );
};
