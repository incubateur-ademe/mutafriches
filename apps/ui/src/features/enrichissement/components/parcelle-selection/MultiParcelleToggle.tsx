import React, { useState } from "react";
import { useEventTracking } from "../../../../shared/hooks/useEventTracking";
import { ModalInfo } from "../../../../shared/components/common/ModalInfo";

interface MultiParcelleToggleProps {
  isMulti: boolean;
  onChange: (isMulti: boolean) => void;
}

export const MultiParcelleToggle: React.FC<MultiParcelleToggleProps> = ({ isMulti, onChange }) => {
  const { trackInteretMultiParcelles } = useEventTracking();
  const [trackingEnvoye, setTrackingEnvoye] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleChange = async (value: string) => {
    if (value === "2") {
      if (!trackingEnvoye) {
        await trackInteretMultiParcelles("step1_toggle");
        setTrackingEnvoye(true);
      }
      setIsModalOpen(true);
      return;
    }
    onChange(value === "2");
  };

  return (
    <>
      <fieldset className="fr-segmented fr-segmented--sm fr-mb-4w">
        <div className="fr-segmented__elements">
          <div className="fr-segmented__element">
            <input
              value="1"
              checked={!isMulti}
              type="radio"
              id="multiparcelle-simple"
              name="multiparcelle"
              onChange={() => handleChange("1")}
            />
            <label className="fr-icon-home-4-fill fr-label" htmlFor="multiparcelle-simple">
              Une parcelle
            </label>
          </div>
          <div className="fr-segmented__element">
            <input
              value="2"
              checked={isMulti}
              type="radio"
              id="multiparcelle-multi"
              name="multiparcelle"
              onChange={() => handleChange("2")}
            />
            <label className="fr-icon-community-fill fr-label" htmlFor="multiparcelle-multi">
              Plusieurs parcelles
            </label>
          </div>
        </div>
      </fieldset>

      <ModalInfo
        id="modal-multi-parcelles"
        title="Fonctionnalité à venir"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        icon="fr-icon-information-line"
      >
        <p>
          La gestion multi-parcelles n'est pas encore disponible mais le sera bientôt ! Cette
          fonctionnalité vous permettra d'analyser plusieurs parcelles simultanément.
        </p>
      </ModalInfo>
    </>
  );
};
