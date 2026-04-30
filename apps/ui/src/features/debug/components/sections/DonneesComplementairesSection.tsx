import React from "react";
import { getManualDataLabel } from "../../utils/debug.helpers";

interface DonneesComplementairesSectionProps {
  manualData?: Record<string, string>;
  noWrapper?: boolean;
}

export const DonneesComplementairesSection: React.FC<DonneesComplementairesSectionProps> = ({
  manualData,
  noWrapper = false,
}) => {
  if (!manualData || Object.keys(manualData).length === 0) {
    const empty = <p className="fr-text--sm">Aucune donn&eacute;e compl&eacute;mentaire saisie.</p>;
    if (noWrapper) return empty;
    return (
      <details className="debug-panel__section">
        <summary>Donn&eacute;es compl&eacute;mentaires</summary>
        <div className="debug-panel__section-content">{empty}</div>
      </details>
    );
  }

  const content = (
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
  );

  if (noWrapper) return content;

  return (
    <details className="debug-panel__section">
      <summary>Donn&eacute;es compl&eacute;mentaires</summary>
      <div className="debug-panel__section-content">{content}</div>
    </details>
  );
};
