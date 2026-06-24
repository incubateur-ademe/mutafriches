import React, { useMemo } from "react";
import {
  buildRecapitulatifSite,
  DonneesComplementairesInputDto,
  EnrichissementOutputDto,
} from "@mutafriches/shared-types";
import { ModalInfo } from "../../../shared/components/common/ModalInfo";
import { RecapTable } from "./RecapTable";

interface SiteRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrichissement?: EnrichissementOutputDto;
  complementaires?: Partial<DonneesComplementairesInputDto>;
}

/**
 * Modale de récapitulatif détaillé du site : table des 27 critères
 * (valeur, mode de saisie, source) construite par le builder partagé.
 */
export const SiteRecapModal: React.FC<SiteRecapModalProps> = ({
  isOpen,
  onClose,
  enrichissement,
  complementaires,
}) => {
  const sections = useMemo(
    () => buildRecapitulatifSite(enrichissement, complementaires),
    [enrichissement, complementaires],
  );

  return (
    <ModalInfo
      id="modal-recap-site"
      title="Récapitulatif du site"
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      icon="fr-icon-map-pin-2-line"
    >
      <RecapTable sections={sections} />
    </ModalInfo>
  );
};
