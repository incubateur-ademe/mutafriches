import React, { useMemo } from "react";
import {
  buildDetailUsage,
  DonneesComplementairesInputDto,
  EnrichissementOutputDto,
  UsageResultatDetaille,
} from "@mutafriches/shared-types";
import { ModalInfo } from "../../../shared/components/common/ModalInfo";
import { getBadgeConfig, getUsageInfo } from "../utils/usagesLabels.utils";
import { UsageDetailTable, UsageRatioBar } from "@shared/components/recap";

interface UsageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  usage?: UsageResultatDetaille | null;
  enrichissement?: EnrichissementOutputDto;
  complementaires?: Partial<DonneesComplementairesInputDto>;
}

/**
 * Modale de détail d'un usage : compatibilité, avantages/contraintes
 * et table des critères (valeur, pondération, impact).
 */
export const UsageDetailModal: React.FC<UsageDetailModalProps> = ({
  isOpen,
  onClose,
  usage,
  enrichissement,
  complementaires,
}) => {
  const sections = useMemo(
    () => (usage ? buildDetailUsage(usage, enrichissement, complementaires) : []),
    [usage, enrichissement, complementaires],
  );

  const info = usage ? getUsageInfo(usage.usage) : null;
  const badge = usage ? getBadgeConfig(usage.indiceMutabilite) : null;
  const avantages = usage?.avantages ?? 0;
  const contraintes = usage?.contraintes ?? 0;

  // En-tête : badge potentiel, puis titre avec illustration, puis ligne compatibilité
  const header =
    usage && badge && info ? (
      <div>
        <span
          className="fr-badge fr-badge--sm"
          style={{ color: badge.textColor, backgroundColor: badge.backgroundColor }}
        >
          {badge.label}
        </span>
        <h2
          id="modal-detail-usage-title"
          className="fr-modal__title fr-mt-1w"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <img src={info.image} alt="" width={32} height={32} />
          {info.label}
        </h2>
        <p className="fr-mb-0 fr-mt-1w">
          <strong>{Math.round(usage.indiceMutabilite)} % de compatibilité</strong>{" "}
          <span style={{ fontWeight: 400 }}>Indice = avantages / (avantages + contraintes)</span>
        </p>
      </div>
    ) : undefined;

  return (
    <ModalInfo
      id="modal-detail-usage"
      title={info?.label ?? "Détail de l'usage"}
      header={header}
      size="xl"
      isOpen={isOpen}
      onClose={onClose}
    >
      {usage && badge && (
        <>
          <UsageRatioBar avantages={avantages} contraintes={contraintes} />
          <UsageDetailTable sections={sections} />
        </>
      )}
    </ModalInfo>
  );
};
