import React from "react";
import {
  EnrichissementOutputDto,
  libelleEnum,
  RGA_LABELS,
  CAVITES_LABELS,
  INONDATION_LABELS,
  ZONAGE_REGLEMENTAIRE_LABELS,
  ZONAGE_ENVIRONNEMENTAL_LABELS,
  ZONAGE_PATRIMONIAL_LABELS,
  ZONAGE_ABC_LOGEMENT_LABELS,
} from "@mutafriches/shared-types";
import { DsfrAccordion } from "@shared/components/dsfr/DsfrAccordion";
import {
  formatDistance,
  formatBoolean,
  getBooleanBadgeClass,
  getRiskBadgeClass,
} from "../../utils/debug.helpers";

interface EnrichissementSectionProps {
  enrichmentData?: EnrichissementOutputDto;
  noWrapper?: boolean;
}

export const EnrichissementSection: React.FC<EnrichissementSectionProps> = ({
  enrichmentData,
  noWrapper = false,
}) => {
  if (!enrichmentData) {
    const empty = <p className="fr-text--sm">Aucune donn&eacute;e disponible.</p>;
    if (noWrapper) return empty;
    return <DsfrAccordion title="Données d'enrichissement">{empty}</DsfrAccordion>;
  }

  const content = (
    <>
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

        {/* Distance ITE fret — désactivé, en attente validation Cerema */}

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
            {libelleEnum(RGA_LABELS, enrichmentData.risqueRetraitGonflementArgile)}
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
            {libelleEnum(CAVITES_LABELS, enrichmentData.risqueCavitesSouterraines)}
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
            {libelleEnum(INONDATION_LABELS, enrichmentData.risqueInondation)}
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
        <dd>{libelleEnum(ZONAGE_REGLEMENTAIRE_LABELS, enrichmentData.zonageReglementaire)}</dd>

        <dt>Environnemental</dt>
        <dd>{libelleEnum(ZONAGE_ENVIRONNEMENTAL_LABELS, enrichmentData.zonageEnvironnemental)}</dd>

        <dt>Patrimonial</dt>
        <dd>{libelleEnum(ZONAGE_PATRIMONIAL_LABELS, enrichmentData.zonagePatrimonial)}</dd>

        <dt>ABC logement</dt>
        <dd>{libelleEnum(ZONAGE_ABC_LOGEMENT_LABELS, enrichmentData.zonageAbcLogement)}</dd>
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
    </>
  );

  if (noWrapper) return content;

  return <DsfrAccordion title="Données d'enrichissement">{content}</DsfrAccordion>;
};
