import React from "react";
import { EnrichissementOutputDto } from "@mutafriches/shared-types";
import {
  formatDistance,
  formatBoolean,
  getBooleanBadgeClass,
  getRiskBadgeClass,
} from "../../utils/debug.helpers";

interface EnrichissementSectionProps {
  enrichmentData?: EnrichissementOutputDto;
}

export const EnrichissementSection: React.FC<EnrichissementSectionProps> = ({ enrichmentData }) => {
  if (!enrichmentData) {
    return (
      <details className="debug-panel__section">
        <summary>Donn&eacute;es d'enrichissement</summary>
        <div className="debug-panel__section-content">
          <p className="fr-text--sm">Aucune donn&eacute;e disponible.</p>
        </div>
      </details>
    );
  }

  return (
    <details className="debug-panel__section">
      <summary>Donn&eacute;es d'enrichissement</summary>
      <div className="debug-panel__section-content">
        {/* Localisation et accessibilite */}
        <h4 className="debug-panel__subtitle">Localisation et accessibilit&eacute;</h4>
        <dl className="debug-panel__data-grid">
          <dt>Centre-ville</dt>
          <dd>
            <span
              className={`fr-badge fr-badge--sm ${getBooleanBadgeClass(enrichmentData.siteEnCentreVille)}`}
            >
              {formatBoolean(enrichmentData.siteEnCentreVille)}
            </span>
          </dd>

          <dt>Distance autoroute</dt>
          <dd>{formatDistance(enrichmentData.distanceAutoroute)}</dd>

          <dt>Distance transport en commun</dt>
          <dd>{formatDistance(enrichmentData.distanceTransportCommun)}</dd>

          <dt>Commerces / services</dt>
          <dd>
            <span
              className={`fr-badge fr-badge--sm ${getBooleanBadgeClass(enrichmentData.proximiteCommercesServices)}`}
            >
              {formatBoolean(enrichmentData.proximiteCommercesServices)}
            </span>
          </dd>
        </dl>

        {/* Infrastructure */}
        <h4 className="debug-panel__subtitle">Infrastructure</h4>
        <dl className="debug-panel__data-grid">
          <dt>Distance raccordement &eacute;lectrique</dt>
          <dd>{formatDistance(enrichmentData.distanceRaccordementElectrique)}</dd>
        </dl>

        {/* Contexte urbain */}
        <h4 className="debug-panel__subtitle">Contexte urbain</h4>
        <dl className="debug-panel__data-grid">
          <dt>Taux logements vacants</dt>
          <dd>
            {enrichmentData.tauxLogementsVacants !== null &&
            enrichmentData.tauxLogementsVacants !== undefined
              ? `${enrichmentData.tauxLogementsVacants} %`
              : "Non disponible"}
          </dd>
        </dl>

        {/* Risques */}
        <h4 className="debug-panel__subtitle">Risques</h4>
        <dl className="debug-panel__data-grid">
          <dt>Risques technologiques</dt>
          <dd>
            <span
              className={`fr-badge fr-badge--sm ${getRiskBadgeClass(enrichmentData.presenceRisquesTechnologiques)}`}
            >
              {formatBoolean(enrichmentData.presenceRisquesTechnologiques)}
            </span>
          </dd>

          <dt>Retrait gonflement argiles</dt>
          <dd>
            <span
              className={`fr-badge fr-badge--sm ${
                enrichmentData.risqueRetraitGonflementArgile === "aucun"
                  ? "fr-badge--success"
                  : enrichmentData.risqueRetraitGonflementArgile === "faible-ou-moyen"
                    ? "fr-badge--warning"
                    : enrichmentData.risqueRetraitGonflementArgile === "fort"
                      ? "fr-badge--error"
                      : "fr-badge--info"
              }`}
            >
              {enrichmentData.risqueRetraitGonflementArgile ?? "Non disponible"}
            </span>
          </dd>

          <dt>Cavit&eacute;s souterraines</dt>
          <dd>
            <span
              className={`fr-badge fr-badge--sm ${
                enrichmentData.risqueCavitesSouterraines === "non"
                  ? "fr-badge--success"
                  : enrichmentData.risqueCavitesSouterraines === "oui"
                    ? "fr-badge--error"
                    : "fr-badge--info"
              }`}
            >
              {enrichmentData.risqueCavitesSouterraines ?? "Non disponible"}
            </span>
          </dd>

          <dt>Inondations</dt>
          <dd>
            <span
              className={`fr-badge fr-badge--sm ${
                enrichmentData.risqueInondation === "non"
                  ? "fr-badge--success"
                  : enrichmentData.risqueInondation === "oui"
                    ? "fr-badge--error"
                    : "fr-badge--info"
              }`}
            >
              {enrichmentData.risqueInondation ?? "Non disponible"}
            </span>
          </dd>

          <dt>Site r&eacute;f&eacute;renc&eacute; pollu&eacute;</dt>
          <dd>
            <span
              className={`fr-badge fr-badge--sm ${getRiskBadgeClass(enrichmentData.siteReferencePollue)}`}
            >
              {formatBoolean(enrichmentData.siteReferencePollue)}
            </span>
          </dd>
        </dl>

        {/* Zonages */}
        <h4 className="debug-panel__subtitle">Zonages</h4>
        <dl className="debug-panel__data-grid">
          <dt>R&eacute;glementaire</dt>
          <dd>{enrichmentData.zonageReglementaire ?? "Non disponible"}</dd>

          <dt>Environnemental</dt>
          <dd>{enrichmentData.zonageEnvironnemental ?? "Non disponible"}</dd>

          <dt>Patrimonial</dt>
          <dd>{enrichmentData.zonagePatrimonial ?? "Non disponible"}</dd>
        </dl>

        {/* Énergies renouvelables (ZAER) */}
        <h4 className="debug-panel__subtitle">&Eacute;nergies renouvelables (ZAER)</h4>
        {enrichmentData.zaer ? (
          <>
            <dl className="debug-panel__data-grid">
              <dt>En zone ZAER</dt>
              <dd>
                <span
                  className={`fr-badge fr-badge--sm ${enrichmentData.zaer.enZoneZaer ? "fr-badge--success" : "fr-badge--info"}`}
                >
                  {formatBoolean(enrichmentData.zaer.enZoneZaer)}
                </span>
              </dd>

              <dt>Nombre de zones</dt>
              <dd>{enrichmentData.zaer.nombreZones}</dd>

              {enrichmentData.zaer.filieres.length > 0 && (
                <>
                  <dt>Fili&egrave;res</dt>
                  <dd>
                    {enrichmentData.zaer.filieres.map((filiere) => (
                      <span
                        key={filiere}
                        className="fr-badge fr-badge--sm fr-badge--green-emeraude"
                        style={{ marginRight: "0.25rem", marginBottom: "0.25rem" }}
                      >
                        {filiere}
                      </span>
                    ))}
                  </dd>
                </>
              )}
            </dl>

            {enrichmentData.zaer.zones.length > 0 && (
              <table className="debug-panel__usage-table" style={{ marginTop: "0.5rem" }}>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Fili&egrave;re</th>
                    <th>D&eacute;tail</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichmentData.zaer.zones.map((zone, index) => (
                    <tr key={index}>
                      <td>{zone.nom ?? "Sans nom"}</td>
                      <td>
                        <span className="fr-badge fr-badge--sm fr-badge--green-emeraude">
                          {zone.filiere}
                        </span>
                      </td>
                      <td>{zone.detailFiliere ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        ) : (
          <p className="fr-text--sm">Non disponible</p>
        )}
      </div>
    </details>
  );
};
