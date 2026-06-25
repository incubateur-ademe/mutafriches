import React from "react";
import { ModalInfo } from "../../../shared/components/common/ModalInfo";
import { ZCAL_CONFIG } from "../../../shared/config/zcal.config";

interface ContactMultisitesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactMultisitesModal: React.FC<ContactMultisitesModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <ModalInfo
      id="modal-contact-multisites"
      title="Échangez avec l'équipe Mutafriches"
      isOpen={isOpen}
      onClose={onClose}
      showIcon={false}
      size="lg"
    >
      <p>
        Choisissez un créneau pour discuter de l'analyse de plusieurs sites avec l'équipe
        Mutafriches.
      </p>

      <iframe
        title="Prise de rendez-vous avec l'équipe Mutafriches"
        src={ZCAL_CONFIG.embedUrl}
        loading="lazy"
        // Hauteur imposée par le widget ZCal, non couverte par une classe DSFR
        style={{ border: "none", width: "100%", minHeight: "640px", height: "70vh" }}
      />
    </ModalInfo>
  );
};
