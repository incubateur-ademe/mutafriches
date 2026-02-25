import React from "react";
import { EnrichissementOutputDto } from "@mutafriches/shared-types";

interface SourcesMetadataSectionProps {
  enrichmentData?: EnrichissementOutputDto;
}

export const SourcesMetadataSection: React.FC<SourcesMetadataSectionProps> = ({
  enrichmentData,
}) => {
  if (!enrichmentData) {
    return (
      <details className="debug-panel__section">
        <summary>Sources et m&eacute;tadonn&eacute;es</summary>
        <div className="debug-panel__section-content">
          <p className="fr-text--sm">Aucune donn&eacute;e disponible.</p>
        </div>
      </details>
    );
  }

  const sourcesUtilisees = enrichmentData.sourcesUtilisees ?? [];
  const champsManquants = enrichmentData.champsManquants ?? [];
  const sourcesEchouees = enrichmentData.sourcesEchouees ?? [];

  return (
    <details className="debug-panel__section">
      <summary>Sources et m&eacute;tadonn&eacute;es</summary>
      <div className="debug-panel__section-content">
        {/* Sources utilisees */}
        <h4 className="debug-panel__subtitle">
          Sources utilis&eacute;es ({sourcesUtilisees.length})
        </h4>
        <div className="debug-panel__badges">
          {sourcesUtilisees.length > 0 ? (
            sourcesUtilisees.map((source: string) => (
              <span key={source} className="fr-badge fr-badge--sm fr-badge--success">
                {source}
              </span>
            ))
          ) : (
            <span className="fr-text--sm">Aucune</span>
          )}
        </div>

        {/* Champs manquants */}
        {champsManquants.length > 0 && (
          <>
            <h4 className="debug-panel__subtitle">Champs manquants ({champsManquants.length})</h4>
            <div className="debug-panel__badges">
              {champsManquants.map((champ: string) => (
                <span key={champ} className="fr-badge fr-badge--sm fr-badge--warning">
                  {champ}
                </span>
              ))}
            </div>
          </>
        )}

        {/* Sources echouees */}
        {sourcesEchouees.length > 0 && (
          <>
            <h4 className="debug-panel__subtitle">
              Sources &eacute;chou&eacute;es ({sourcesEchouees.length})
            </h4>
            <div className="debug-panel__badges">
              {sourcesEchouees.map((source: string) => (
                <span key={source} className="fr-badge fr-badge--sm fr-badge--error">
                  {source}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </details>
  );
};
