// TODO: supprimer apres analyse
import React, { useState } from "react";
import type { DiagnosticZonages, DiagnosticFeature } from "@mutafriches/shared-types";

interface DiagnosticZonagesSectionProps {
  diagnosticZonages?: DiagnosticZonages;
}

/**
 * Affiche les proprietes brutes d'une feature API Carto dans un bloc collapsible JSON
 */
const FeatureDetails: React.FC<{ feature: DiagnosticFeature; index: number }> = ({
  feature,
  index,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <button
        type="button"
        className="fr-btn fr-btn--sm fr-btn--tertiary-no-outline"
        onClick={() => setIsOpen(!isOpen)}
        style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
      >
        [{index}] {feature.id} {isOpen ? "[-]" : "[+]"}
      </button>
      {isOpen && (
        <pre className="debug-panel__json" style={{ fontSize: "0.7rem", maxHeight: "300px" }}>
          {JSON.stringify(feature.properties, null, 2)}
        </pre>
      )}
    </div>
  );
};

export const DiagnosticZonagesSection: React.FC<DiagnosticZonagesSectionProps> = ({
  diagnosticZonages,
}) => {
  if (!diagnosticZonages) {
    return (
      <details className="debug-panel__section">
        <summary>Diagnostic zonages (brut API)</summary>
        <div className="debug-panel__section-content">
          <p className="fr-text--sm">Aucune donn&eacute;e de diagnostic disponible.</p>
        </div>
      </details>
    );
  }

  const { reglementaire, environnemental, patrimonial } = diagnosticZonages;

  return (
    <details className="debug-panel__section">
      <summary>Diagnostic zonages (brut API)</summary>
      <div className="debug-panel__section-content">
        {/* Zonage r&eacute;glementaire */}
        <h4 className="debug-panel__subtitle">Zonage r&eacute;glementaire</h4>
        {reglementaire ? (
          <>
            <dl className="debug-panel__data-grid">
              <dt>Zonage final</dt>
              <dd>
                <span className="fr-badge fr-badge--sm fr-badge--info">
                  {reglementaire.zonageFinal}
                </span>
              </dd>
            </dl>

            {/* Zone dominante */}
            {reglementaire.zoneDominante && (
              <>
                <h4 className="debug-panel__subtitle">Zone dominante</h4>
                <dl className="debug-panel__data-grid">
                  <dt>Index</dt>
                  <dd>{reglementaire.zoneDominante.index}</dd>
                  <dt>Surface intersection</dt>
                  <dd>
                    {reglementaire.zoneDominante.surfaceIntersection
                      ? `${reglementaire.zoneDominante.surfaceIntersection} m\u00B2`
                      : "N/A"}
                  </dd>
                  <dt>typezone</dt>
                  <dd>{reglementaire.zoneDominante.typezone ?? "null"}</dd>
                  <dt>libelle</dt>
                  <dd>{reglementaire.zoneDominante.libelle ?? "null"}</dd>
                  <dt>libelong</dt>
                  <dd>{reglementaire.zoneDominante.libelong ?? "null"}</dd>
                  <dt>destdomi</dt>
                  <dd>{reglementaire.zoneDominante.destdomi ?? "null"}</dd>
                  <dt>formdomi</dt>
                  <dd>{reglementaire.zoneDominante.formdomi ?? "null"}</dd>
                </dl>
              </>
            )}

            {/* Features brutes zone-urba */}
            {reglementaire.zoneUrba && (
              <>
                <h4 className="debug-panel__subtitle">
                  zone-urba ({reglementaire.zoneUrba.totalFeatures} feature
                  {reglementaire.zoneUrba.totalFeatures > 1 ? "s" : ""})
                </h4>
                {reglementaire.zoneUrba.features.map((f, i) => (
                  <FeatureDetails key={f.id} feature={f} index={i} />
                ))}
              </>
            )}

            {/* Features brutes secteur-cc */}
            {reglementaire.secteurCC && (
              <>
                <h4 className="debug-panel__subtitle">
                  secteur-cc ({reglementaire.secteurCC.totalFeatures} feature
                  {reglementaire.secteurCC.totalFeatures > 1 ? "s" : ""})
                </h4>
                {reglementaire.secteurCC.features.map((f, i) => (
                  <FeatureDetails key={f.id} feature={f} index={i} />
                ))}
              </>
            )}

            {/* Commune */}
            {reglementaire.commune && (
              <>
                <h4 className="debug-panel__subtitle">Commune (municipality)</h4>
                <dl className="debug-panel__data-grid">
                  <dt>INSEE</dt>
                  <dd>{reglementaire.commune.insee}</dd>
                  <dt>Nom</dt>
                  <dd>{reglementaire.commune.name}</dd>
                  <dt>RNU</dt>
                  <dd>
                    <span
                      className={`fr-badge fr-badge--sm ${reglementaire.commune.is_rnu ? "fr-badge--warning" : "fr-badge--success"}`}
                    >
                      {reglementaire.commune.is_rnu ? "Oui" : "Non"}
                    </span>
                  </dd>
                </dl>
              </>
            )}
          </>
        ) : (
          <p className="fr-text--sm">Aucune donn&eacute;e r&eacute;glementaire.</p>
        )}

        {/* Zonage environnemental */}
        <h4 className="debug-panel__subtitle">Zonage environnemental</h4>
        {environnemental ? (
          <dl className="debug-panel__data-grid">
            <dt>Zonage final</dt>
            <dd>
              <span className="fr-badge fr-badge--sm fr-badge--info">
                {environnemental.zonageFinal}
              </span>
            </dd>
            <dt>Natura 2000</dt>
            <dd>
              {environnemental.natura2000
                ? `${environnemental.natura2000.present ? "Oui" : "Non"} (${environnemental.natura2000.nombreZones} zone${environnemental.natura2000.nombreZones > 1 ? "s" : ""})`
                : "N/A"}
            </dd>
            <dt>ZNIEFF</dt>
            <dd>
              {environnemental.znieff
                ? `${environnemental.znieff.present ? "Oui" : "Non"} (T1: ${environnemental.znieff.type1 ? "oui" : "non"}, T2: ${environnemental.znieff.type2 ? "oui" : "non"}, ${environnemental.znieff.nombreZones} zone${environnemental.znieff.nombreZones > 1 ? "s" : ""})`
                : "N/A"}
            </dd>
            <dt>Parc naturel</dt>
            <dd>
              {environnemental.parcNaturel
                ? `${environnemental.parcNaturel.present ? `Oui (${environnemental.parcNaturel.type ?? "?"}) ${environnemental.parcNaturel.nom ?? ""}` : "Non"}`
                : "N/A"}
            </dd>
            <dt>R&eacute;serve naturelle</dt>
            <dd>
              {environnemental.reserveNaturelle
                ? `${environnemental.reserveNaturelle.present ? "Oui" : "Non"} (${environnemental.reserveNaturelle.nombreReserves} r&eacute;serve${environnemental.reserveNaturelle.nombreReserves > 1 ? "s" : ""})`
                : "N/A"}
            </dd>
          </dl>
        ) : (
          <p className="fr-text--sm">Aucune donn&eacute;e environnementale.</p>
        )}

        {/* Zonage patrimonial */}
        <h4 className="debug-panel__subtitle">Zonage patrimonial</h4>
        {patrimonial ? (
          <dl className="debug-panel__data-grid">
            <dt>Zonage final</dt>
            <dd>
              <span className="fr-badge fr-badge--sm fr-badge--info">
                {patrimonial.zonageFinal}
              </span>
            </dd>
            <dt>AC1 (Monuments historiques)</dt>
            <dd>
              {patrimonial.ac1
                ? `${patrimonial.ac1.present ? `Oui (${patrimonial.ac1.type ?? "?"}, ${patrimonial.ac1.nombreZones} zone${patrimonial.ac1.nombreZones > 1 ? "s" : ""})` : "Non"}`
                : "N/A"}
            </dd>
            <dt>AC2 (Sites inscrits/class&eacute;s)</dt>
            <dd>
              {patrimonial.ac2
                ? `${patrimonial.ac2.present ? `Oui (${patrimonial.ac2.nombreZones} zone${patrimonial.ac2.nombreZones > 1 ? "s" : ""})` : "Non"}`
                : "N/A"}
            </dd>
            <dt>AC4 (SPR/ZPPAUP/AVAP)</dt>
            <dd>
              {patrimonial.ac4
                ? `${patrimonial.ac4.present ? `Oui (${patrimonial.ac4.type ?? "?"}, ${patrimonial.ac4.nombreZones} zone${patrimonial.ac4.nombreZones > 1 ? "s" : ""})` : "Non"}`
                : "N/A"}
            </dd>
          </dl>
        ) : (
          <p className="fr-text--sm">Aucune donn&eacute;e patrimoniale.</p>
        )}
      </div>
    </details>
  );
};
