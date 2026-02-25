import React from "react";
import { getManualDataLabel } from "../../utils/debug.helpers";

interface DonneesComplementairesSectionProps {
  manualData?: Record<string, string>;
}

export const DonneesComplementairesSection: React.FC<DonneesComplementairesSectionProps> = ({
  manualData,
}) => {
  if (!manualData || Object.keys(manualData).length === 0) {
    return (
      <details className="debug-panel__section">
        <summary>Donn&eacute;es compl&eacute;mentaires</summary>
        <div className="debug-panel__section-content">
          <p className="fr-text--sm">Aucune donn&eacute;e compl&eacute;mentaire saisie.</p>
        </div>
      </details>
    );
  }

  return (
    <details className="debug-panel__section">
      <summary>Donn&eacute;es compl&eacute;mentaires</summary>
      <div className="debug-panel__section-content">
        <dl className="debug-panel__data-grid">
          {Object.entries(manualData).map(([key, value]) => (
            <React.Fragment key={key}>
              <dt>{getManualDataLabel(key)}</dt>
              <dd>
                {value.includes("ne-sait-pas") ? (
                  <span className="fr-badge fr-badge--sm fr-badge--warning">Ne sait pas</span>
                ) : (
                  <span>{value}</span>
                )}
              </dd>
            </React.Fragment>
          ))}
        </dl>
      </div>
    </details>
  );
};
