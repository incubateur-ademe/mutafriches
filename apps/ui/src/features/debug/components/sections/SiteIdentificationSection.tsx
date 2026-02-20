import React from "react";
import { EnrichissementOutputDto } from "@mutafriches/shared-types";
import { formatSurface } from "../../utils/debug.helpers";

interface SiteIdentificationSectionProps {
  enrichmentData?: EnrichissementOutputDto;
  identifiantSite?: string;
}

export const SiteIdentificationSection: React.FC<SiteIdentificationSectionProps> = ({
  enrichmentData,
  identifiantSite,
}) => {
  if (!enrichmentData) {
    return (
      <details className="debug-panel__section" open>
        <summary>Identification du site</summary>
        <div className="debug-panel__section-content">
          <p className="fr-text--sm">Aucune donn&eacute;e d'enrichissement disponible.</p>
        </div>
      </details>
    );
  }

  const isMultiParcelle = (enrichmentData.nombreParcelles ?? 1) > 1;

  return (
    <details className="debug-panel__section" open>
      <summary>Identification du site</summary>
      <div className="debug-panel__section-content">
        <dl className="debug-panel__data-grid">
          <dt>Identifiant du site</dt>
          <dd>{identifiantSite ?? enrichmentData.identifiantParcelle ?? "N/A"}</dd>

          <dt>Code INSEE</dt>
          <dd>{enrichmentData.codeInsee ?? "N/A"}</dd>

          <dt>Commune</dt>
          <dd>{enrichmentData.commune ?? "N/A"}</dd>

          {enrichmentData.coordonnees && (
            <>
              <dt>Latitude</dt>
              <dd>{enrichmentData.coordonnees.latitude.toFixed(6)}</dd>

              <dt>Longitude</dt>
              <dd>{enrichmentData.coordonnees.longitude.toFixed(6)}</dd>
            </>
          )}

          <dt>Surface du site</dt>
          <dd>{formatSurface(enrichmentData.surfaceSite)}</dd>

          <dt>Surface b&acirc;tie</dt>
          <dd>{formatSurface(enrichmentData.surfaceBati)}</dd>
        </dl>

        {isMultiParcelle && (
          <>
            <h4 className="debug-panel__subtitle">Multi-parcellaire</h4>
            <dl className="debug-panel__data-grid">
              <dt>Nombre de parcelles</dt>
              <dd>{enrichmentData.nombreParcelles}</dd>

              <dt>Parcelle pr&eacute;dominante</dt>
              <dd>{enrichmentData.parcellePredominante ?? "N/A"}</dd>

              <dt>Commune pr&eacute;dominante</dt>
              <dd>{enrichmentData.communePredominante ?? "N/A"}</dd>
            </dl>

            {enrichmentData.identifiantsParcelles && (
              <div style={{ marginTop: "0.5rem" }}>
                <dt
                  className="fr-text--sm"
                  style={{ color: "var(--text-mention-grey)", marginBottom: "0.25rem" }}
                >
                  Parcelles :
                </dt>
                <div className="debug-panel__badges">
                  {enrichmentData.identifiantsParcelles.map((id: string) => (
                    <span key={id} className="fr-badge fr-badge--sm fr-badge--info">
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </details>
  );
};
