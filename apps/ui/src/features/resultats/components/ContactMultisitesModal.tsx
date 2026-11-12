import React from "react";
import { ModalInfo } from "../../../shared/components/common/ModalInfo";
import { ZcalEmbed } from "../../../shared/components/common/ZcalEmbed";

interface ContactMultisitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Objet de l'échange, quand la modale s'ouvre ailleurs que depuis les résultats
  message?: string;
}

export const ContactMultisitesModal: React.FC<ContactMultisitesModalProps> = ({
  isOpen,
  onClose,
  message = "Choisissez un créneau pour discuter de l'analyse de plusieurs sites avec l'équipe Mutafriches.",
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
      <p>{message}</p>

      <ZcalEmbed active={isOpen} />
    </ModalInfo>
  );
};
