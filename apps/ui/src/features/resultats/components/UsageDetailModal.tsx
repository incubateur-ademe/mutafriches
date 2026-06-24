import React, { useMemo } from "react";
import {
  buildDetailUsage,
  DonneesComplementairesInputDto,
  EnrichissementOutputDto,
  UsageResultatDetaille,
} from "@mutafriches/shared-types";
import { ModalInfo } from "../../../shared/components/common/ModalInfo";
import { getBadgeConfig, getUsageInfo } from "../utils/usagesLabels.utils";
import { UsageDetailTable } from "./UsageDetailTable";

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
  const totalPositif = avantages + contraintes;
  const partAvantages = totalPositif > 0 ? (avantages / totalPositif) * 100 : 0;

  return (
    <ModalInfo
      id="modal-detail-usage"
      title={info?.label ?? "Détail de l'usage"}
      showIcon={false}
      size="xl"
      isOpen={isOpen}
      onClose={onClose}
    >
      {usage && badge && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1rem" }}>
            <span
              className="fr-badge fr-badge--sm"
              style={{ color: badge.textColor, backgroundColor: badge.backgroundColor }}
            >
              {badge.label}
            </span>
            <span>
              <strong>{Math.round(usage.indiceMutabilite)} %</strong> de compatibilité
            </span>
            <span className="fr-text--sm" style={{ color: "var(--text-mention-grey)" }}>
              Indice = avantages / (avantages + contraintes)
            </span>
          </div>

          {/* Barre avantages / contraintes */}
          <div
            className="fr-mt-2w"
            style={{
              display: "flex",
              height: "10px",
              borderRadius: "5px",
              overflow: "hidden",
              backgroundColor: "var(--background-contrast-grey)",
            }}
          >
            <div style={{ width: `${partAvantages}%`, backgroundColor: "#B8FEC9" }} />
            <div style={{ flex: 1, backgroundColor: "#FFBDBE" }} />
          </div>
          <div
            className="fr-mb-3w fr-mt-1w"
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <span className="fr-text--sm">Avantages : {avantages.toFixed(1)}</span>
            <span className="fr-text--sm">Contraintes : {contraintes.toFixed(1)}</span>
          </div>

          <UsageDetailTable sections={sections} />
        </>
      )}
    </ModalInfo>
  );
};
