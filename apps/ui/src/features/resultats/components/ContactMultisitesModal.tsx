import React from "react";
import { ModalInfo } from "../../../shared/components/common/ModalInfo";
import { ZcalEmbed } from "../../../shared/components/common/ZcalEmbed";

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

      <ZcalEmbed active={isOpen} />
    </ModalInfo>
  );
};
