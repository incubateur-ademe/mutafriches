import React, { useState } from "react";
import {
  EnrichissementOutputDto,
  DiagnosticFeature,
  DiagnosticReglementaire,
} from "@mutafriches/shared-types";

interface DiagnosticZonagesSectionProps {
  enrichmentData?: EnrichissementOutputDto;
}

/**
 * Sous-composant : affiche les propriétés d'une feature brute API
 */
const FeatureDetails: React.FC<{ feature: DiagnosticFeature }> = ({ feature }) => {
  const [isOpen, setIsOpen] = useState(false);

  const entries = Object.entries(feature.properties).filter(
    ([, value]) => value !== null && value !== undefined && value !== "",
  );

  if (entries.length === 0) return null;

  return (
    <div style={{ marginBottom: "0.25rem" }}>
      <button
        type="button"
        className="fr-btn fr-btn--sm fr-btn--tertiary-no-outline"
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: "0.125rem 0.5rem", fontSize: "0.75rem" }}
      >
        {isOpen ? "Masquer" : "Voir"} {feature.id || "feature"}
      </button>
      {isOpen && (
        <dl
          className="debug-panel__data-grid"
          style={{ marginTop: "0.25rem", fontSize: "0.75rem" }}
        >
          {entries.map(([key, value]) => (
            <React.Fragment key={key}>
              <dt style={{ fontWeight: 600 }}>{key}</dt>
              <dd>{String(value)}</dd>
            </React.Fragment>
          ))}
        </dl>
      )}
    </div>
  );
};

/**
 * Sous-composant : affiche le diagnostic réglementaire
 */
const DiagnosticReglementaireBlock: React.FC<{
  data: DiagnosticReglementaire;
}> = ({ data }) => (
  <div style={{ marginBottom: "0.75rem" }}>
    <h5 className="debug-panel__subtitle" style={{ fontSize: "0.85rem" }}>
      R&eacute;glementaire : {data.zonageFinal}
    </h5>

    {/* Commune */}
    {data.commune && (
      <dl className="debug-panel__data-grid">
        <dt>Commune</dt>
        <dd>
          {data.commune.name} ({data.commune.insee})
        </dd>
        <dt>RNU</dt>
        <dd>
          <span
            className={`fr-badge fr-badge--sm ${data.commune.is_rnu ? "fr-badge--warning" : "fr-badge--success"}`}
          >
            {data.commune.is_rnu ? "Oui (RNU)" : "Non (PLU/CC)"}
          </span>
        </dd>
      </dl>
    )}

    {/* Zone dominante */}
    {data.zoneDominante && (
      <>
        <p className="fr-text--xs fr-mb-1v" style={{ fontWeight: 600 }}>
          Zone dominante (index {data.zoneDominante.index})
        </p>
        <dl className="debug-panel__data-grid">
          {data.zoneDominante.typezone && (
            <>
              <dt>Type zone</dt>
              <dd>
                <span className="fr-badge fr-badge--sm fr-badge--blue-cumulus">
                  {data.zoneDominante.typezone}
                </span>
              </dd>
            </>
          )}
          {data.zoneDominante.libelle && (
            <>
              <dt>Libell&eacute;</dt>
              <dd>{data.zoneDominante.libelle}</dd>
            </>
          )}
          {data.zoneDominante.libelong && (
            <>
              <dt>Libell&eacute; long</dt>
              <dd>{data.zoneDominante.libelong}</dd>
            </>
          )}
          {data.zoneDominante.destdomi && (
            <>
              <dt>Destination dominante</dt>
              <dd>{data.zoneDominante.destdomi}</dd>
            </>
          )}
          {data.zoneDominante.surfaceIntersection !== undefined && (
            <>
              <dt>Surface intersection</dt>
              <dd>{Math.round(data.zoneDominante.surfaceIntersection)} m&sup2;</dd>
            </>
          )}
        </dl>
      </>
    )}

    {/* Features brutes zone-urba */}
    {data.zoneUrba && data.zoneUrba.features.length > 0 && (
      <details style={{ marginTop: "0.5rem" }}>
        <summary className="fr-text--xs">
          Zone-urba : {data.zoneUrba.totalFeatures} feature(s)
        </summary>
        <div style={{ paddingLeft: "0.5rem", marginTop: "0.25rem" }}>
          {data.zoneUrba.features.map((f) => (
            <FeatureDetails key={f.id} feature={f} />
          ))}
        </div>
      </details>
    )}

    {/* Features brutes secteur-cc */}
    {data.secteurCC && data.secteurCC.features.length > 0 && (
      <details style={{ marginTop: "0.25rem" }}>
        <summary className="fr-text--xs">
          Secteur-CC : {data.secteurCC.totalFeatures} feature(s)
        </summary>
        <div style={{ paddingLeft: "0.5rem", marginTop: "0.25rem" }}>
          {data.secteurCC.features.map((f) => (
            <FeatureDetails key={f.id} feature={f} />
          ))}
        </div>
      </details>
    )}
  </div>
);

/**
 * Section du panneau de diagnostic affichant les données brutes des APIs de zonage
 * Uniquement visible en dev/staging (les données sont absentes en production)
 */
export const DiagnosticZonagesSection: React.FC<DiagnosticZonagesSectionProps> = ({
  enrichmentData,
}) => {
  const diagnostic = enrichmentData?.diagnosticZonages;

  if (!diagnostic) {
    return null;
  }

  return (
    <details className="debug-panel__section">
      <summary>Diagnostic zonages (donn&eacute;es brutes API)</summary>
      <div className="debug-panel__section-content">
        {/* Réglementaire */}
        {diagnostic.reglementaire ? (
          <DiagnosticReglementaireBlock data={diagnostic.reglementaire} />
        ) : (
          <p className="fr-text--sm">R&eacute;glementaire : non disponible</p>
        )}

        <hr className="fr-hr fr-my-2v" />

        {/* Environnemental */}
        <h5 className="debug-panel__subtitle" style={{ fontSize: "0.85rem" }}>
          Environnemental : {diagnostic.environnemental?.zonageFinal ?? "non disponible"}
        </h5>
        {diagnostic.environnemental ? (
          <dl className="debug-panel__data-grid">
            <dt>Natura 2000</dt>
            <dd>
              {diagnostic.environnemental.natura2000 ? (
                <span
                  className={`fr-badge fr-badge--sm ${diagnostic.environnemental.natura2000.present ? "fr-badge--warning" : "fr-badge--success"}`}
                >
                  {diagnostic.environnemental.natura2000.present
                    ? `Oui (${diagnostic.environnemental.natura2000.nombreZones} zone(s))`
                    : "Non"}
                </span>
              ) : (
                "Erreur API"
              )}
            </dd>

            <dt>ZNIEFF</dt>
            <dd>
              {diagnostic.environnemental.znieff ? (
                <span
                  className={`fr-badge fr-badge--sm ${diagnostic.environnemental.znieff.present ? "fr-badge--warning" : "fr-badge--success"}`}
                >
                  {diagnostic.environnemental.znieff.present
                    ? `Oui (${diagnostic.environnemental.znieff.nombreZones} zone(s)${diagnostic.environnemental.znieff.type1 ? " - Type 1" : ""}${diagnostic.environnemental.znieff.type2 ? " - Type 2" : ""})`
                    : "Non"}
                </span>
              ) : (
                "Erreur API"
              )}
            </dd>

            <dt>Parc naturel</dt>
            <dd>
              {diagnostic.environnemental.parcNaturel ? (
                <span
                  className={`fr-badge fr-badge--sm ${diagnostic.environnemental.parcNaturel.present ? "fr-badge--warning" : "fr-badge--success"}`}
                >
                  {diagnostic.environnemental.parcNaturel.present
                    ? `Oui (${diagnostic.environnemental.parcNaturel.type}${diagnostic.environnemental.parcNaturel.nom ? ` - ${diagnostic.environnemental.parcNaturel.nom}` : ""})`
                    : "Non"}
                </span>
              ) : (
                "Erreur API"
              )}
            </dd>

            <dt>R&eacute;serve naturelle</dt>
            <dd>
              {diagnostic.environnemental.reserveNaturelle ? (
                <span
                  className={`fr-badge fr-badge--sm ${diagnostic.environnemental.reserveNaturelle.present ? "fr-badge--warning" : "fr-badge--success"}`}
                >
                  {diagnostic.environnemental.reserveNaturelle.present
                    ? `Oui (${diagnostic.environnemental.reserveNaturelle.nombreReserves} r\u00e9serve(s))`
                    : "Non"}
                </span>
              ) : (
                "Erreur API"
              )}
            </dd>
          </dl>
        ) : (
          <p className="fr-text--sm">Non disponible</p>
        )}

        <hr className="fr-hr fr-my-2v" />

        {/* Patrimonial */}
        <h5 className="debug-panel__subtitle" style={{ fontSize: "0.85rem" }}>
          Patrimonial : {diagnostic.patrimonial?.zonageFinal ?? "non disponible"}
        </h5>
        {diagnostic.patrimonial ? (
          <dl className="debug-panel__data-grid">
            <dt>AC1 (Monuments historiques)</dt>
            <dd>
              {diagnostic.patrimonial.ac1 ? (
                <span
                  className={`fr-badge fr-badge--sm ${diagnostic.patrimonial.ac1.present ? "fr-badge--warning" : "fr-badge--success"}`}
                >
                  {diagnostic.patrimonial.ac1.present
                    ? `Oui (${diagnostic.patrimonial.ac1.nombreZones} zone(s)${diagnostic.patrimonial.ac1.type ? ` - ${diagnostic.patrimonial.ac1.type}` : ""})`
                    : "Non"}
                </span>
              ) : (
                "Erreur API"
              )}
            </dd>

            <dt>AC2 (Sites inscrits/class&eacute;s)</dt>
            <dd>
              {diagnostic.patrimonial.ac2 ? (
                <span
                  className={`fr-badge fr-badge--sm ${diagnostic.patrimonial.ac2.present ? "fr-badge--warning" : "fr-badge--success"}`}
                >
                  {diagnostic.patrimonial.ac2.present
                    ? `Oui (${diagnostic.patrimonial.ac2.nombreZones} zone(s))`
                    : "Non"}
                </span>
              ) : (
                "Erreur API"
              )}
            </dd>

            <dt>AC4 (SPR/ZPPAUP/AVAP)</dt>
            <dd>
              {diagnostic.patrimonial.ac4 ? (
                <span
                  className={`fr-badge fr-badge--sm ${diagnostic.patrimonial.ac4.present ? "fr-badge--warning" : "fr-badge--success"}`}
                >
                  {diagnostic.patrimonial.ac4.present
                    ? `Oui (${diagnostic.patrimonial.ac4.nombreZones} zone(s)${diagnostic.patrimonial.ac4.type ? ` - ${diagnostic.patrimonial.ac4.type}` : ""})`
                    : "Non"}
                </span>
              ) : (
                "Erreur API"
              )}
            </dd>
          </dl>
        ) : (
          <p className="fr-text--sm">Non disponible</p>
        )}
      </div>
    </details>
  );
};
