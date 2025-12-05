import React from "react";
import { ParcelleUiModel } from "../../../../shared/types/parcelle.models";
import { EnrichmentInfoField } from "./EnrichmentInfoField";

interface EnrichmentDisplayZoneProps {
  data: ParcelleUiModel | null;
  onNext?: () => void;
  isLoadingNext?: boolean;
}

export const EnrichmentDisplayZone: React.FC<EnrichmentDisplayZoneProps> = ({
  data,
  onNext,
  isLoadingNext = false,
}) => {
  if (!data) return null;

  return (
    <div id="enrichment-display-zone" className="fr-mt-4w fade-in">
      <hr />
      <h3>Données publiques sourcées</h3>
      <p className="fr-text--sm">
        Ces informations ont été collectées automatiquement depuis les bases de données publiques,
        assurez-vous qu'elles soient correctes.
      </p>

      {/* Onglets */}
      <div className="fr-tabs fr-mt-4w">
        <ul
          className="fr-tabs__list"
          role="tablist"
          aria-label="Données récupérées automatiquement"
        >
          <li role="presentation">
            <button
              type="button"
              id="tab-infos"
              className="fr-tabs__tab"
              tabIndex={0}
              role="tab"
              aria-selected="true"
              aria-controls="tab-infos-panel"
            >
              Informations du site
            </button>
          </li>
          <li role="presentation">
            <button
              type="button"
              id="tab-env"
              className="fr-tabs__tab"
              tabIndex={-1}
              role="tab"
              aria-selected="false"
              aria-controls="tab-env-panel"
            >
              Environnement du site
            </button>
          </li>
          <li role="presentation">
            <button
              type="button"
              id="tab-risques"
              className="fr-tabs__tab"
              tabIndex={-1}
              role="tab"
              aria-selected="false"
              aria-controls="tab-risques-panel"
            >
              Risques & zonage
            </button>
          </li>
        </ul>

        {/* Panneau Infos parcelle */}
        <div
          id="tab-infos-panel"
          className="fr-tabs__panel fr-tabs__panel--selected"
          role="tabpanel"
          aria-labelledby="tab-infos"
          tabIndex={0}
        >
          <div className="fr-grid-row fr-grid-row--gutters">
            <EnrichmentInfoField
              id="commune"
              label="Commune"
              value={data.commune}
              tooltip={
                <>
                  Récupéré depuis l'API IGN Cadastre :<br />
                  <a
                    href="https://apicarto.ign.fr/api/doc/cadastre"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fr-link fr-text--xs"
                  >
                    apicarto.ign.fr/api/doc/cadastre
                  </a>
                </>
              }
            />
            <EnrichmentInfoField
              id="identifiant-parcelle"
              label="Identifiant parcelle"
              value={data.identifiantParcelle}
              tooltip={
                <>
                  Récupéré depuis l'API IGN Cadastre :<br />
                  <a
                    href="https://apicarto.ign.fr/api/doc/cadastre"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fr-link fr-text--xs"
                  >
                    apicarto.ign.fr/api/doc/cadastre
                  </a>
                </>
              }
            />
            <EnrichmentInfoField
              id="surface-site"
              label="Surface du site"
              value={data.surfaceParcelle}
              tooltip={
                <>
                  Récupéré depuis l'API IGN Cadastre :<br />
                  <a
                    href="https://apicarto.ign.fr/api/doc/cadastre"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fr-link fr-text--xs"
                  >
                    apicarto.ign.fr/api/doc/cadastre
                  </a>
                </>
              }
            />
            <EnrichmentInfoField
              id="surface-batie"
              label="Surface bâtie"
              value={data.surfaceBatie}
              tooltip={
                <>
                  Récupéré depuis l'API BDNB :<br />
                  <a
                    href="https://api.bdnb.io/v1/bdnb"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fr-link fr-text--xs"
                  >
                    api.bdnb.io/v1/bdnb
                  </a>
                </>
              }
            />
          </div>
        </div>

        {/* Panneau Environnement */}
        <div
          id="tab-env-panel"
          className="fr-tabs__panel"
          role="tabpanel"
          aria-labelledby="tab-env"
          tabIndex={0}
        >
          <div className="fr-grid-row fr-grid-row--gutters">
            <EnrichmentInfoField
              id="site-centre-ville"
              label="Site en centre ville"
              value={data.centreVille}
              tooltip={
                <>
                  Récupéré depuis l'API de l'annuaire du Service public :<br />
                  <a
                    href="https://api-lannuaire.service-public.gouv.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fr-link fr-text--xs"
                  >
                    api-lannuaire.service-public.gouv.fr
                  </a>
                </>
              }
            />
            <EnrichmentInfoField
              id="distance-voie-grande-circulation"
              label="Distance voie à grande circulation"
              value={data.distanceAutoroute}
              tooltip={
                <>
                  Récupéré depuis l'API IGN Géoplateforme WFS :<br />
                  <a
                    href="https://geoservices.ign.fr/services-web-essentiels"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fr-link fr-text--xs"
                  >
                    geoservices.ign.fr/services-web-essentiels
                  </a>
                </>
              }
            />
            <EnrichmentInfoField
              id="distance-transport-commun"
              label="Distance au transport en commun"
              value={data.distanceTransportsEnCommun}
              tooltip={"Pas de données publiques disponibles pour l'instant"}
            />
            <EnrichmentInfoField
              id="proximite-commerces-services"
              label="Proximité des commerces et services"
              value={data.proximiteCommerces}
              tooltip={
                <>
                  Récupéré depuis la base permanente des équipements (BPE) :<br />
                  <a
                    href="https://www.data.gouv.fr/fr/datasets/base-permanente-des-equipements-bpe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fr-link fr-text--xs"
                  >
                    data.gouv.fr/datasets/base-permanente-des-equipements-bpe
                  </a>
                </>
              }
            />
            <EnrichmentInfoField
              id="distance-raccordement-electrique"
              label="Distance au raccordement électrique"
              value={data.distanceRaccordement}
              tooltip={
                <>
                  Récupéré depuis l'API Enedis :<br />
                  <a
                    href="https://data.enedis.fr/api/explore/v2.1/catalog/datasets"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fr-link fr-text--xs"
                  >
                    data.enedis.fr/api/explore/v2.1/catalog/datasets
                  </a>
                </>
              }
            />
            <EnrichmentInfoField
              id="taux-logements-vacants"
              label="Taux de logements vacants"
              value={data.tauxLV}
              tooltip={
                <>
                  Récupéré depuis l'API tabulaire de data.gouv.fr :<br />
                  <a
                    href="https://www.data.gouv.fr/datasets/logements-vacants-du-parc-prive-en-france-et-par-commune-departement-region"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fr-link fr-text--xs"
                  >
                    data.gouv.fr/datasets/logements-vacants
                  </a>
                </>
              }
            />
          </div>
        </div>

        {/* Panneau Risques */}
        <div
          id="tab-risques-panel"
          className="fr-tabs__panel"
          role="tabpanel"
          aria-labelledby="tab-risques"
          tabIndex={0}
        >
          <div className="fr-grid-row fr-grid-row--gutters">
            <EnrichmentInfoField
              id="presence-risques-technologiques"
              label="Présence de risques technologiques"
              value={data.risquesTechno}
              tooltip={
                <>
                  Récupéré depuis les données de l'API Georisques :<br />
                  <a
                    href="https://www.georisques.gouv.fr/citoyen-recherche-map"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fr-link fr-text--xs"
                  >
                    georisques.gouv.fr/doc-api
                  </a>
                </>
              }
            />
            <EnrichmentInfoField
              id="presence-risques-naturels"
              label="Présence de risques naturels"
              value={data.risquesNaturels}
              tooltip={
                <>
                  Récupéré depuis les données de l'API Georisques :<br />
                  <a
                    href="https://www.georisques.gouv.fr/citoyen-recherche-map"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fr-link fr-text--xs"
                  >
                    georisques.gouv.fr/citoyen-recherche-map
                  </a>
                  <br /> <br />
                  En l'absence de la numérisation des plans de prévention des risques, cette donnée
                  est susceptible d'être faussée
                </>
              }
            />
            <EnrichmentInfoField
              id="type-zonage-environnemental"
              label="Type de zonage environnemental"
              value={data.zonageEnviro}
              tooltip={
                <>
                  Données enrichies via les API Carto Nature et GPU de l'IGN :<br />
                  <a
                    href="https://apicarto.ign.fr/api/doc/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fr-link fr-text--xs"
                  >
                    apicarto.ign.fr/api/doc/
                  </a>
                </>
              }
            />
            <EnrichmentInfoField
              id="zonage-reglementaire"
              label="Zonage réglementaire"
              value={data.zonageUrba}
              tooltip={
                <>
                  Données enrichies via les API Carto Nature et GPU de l'IGN :<br />
                  <a
                    href="https://apicarto.ign.fr/api/doc/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fr-link fr-text--xs"
                  >
                    apicarto.ign.fr/api/doc/
                  </a>
                </>
              }
            />
            <EnrichmentInfoField
              id="type-zonage-patrimonial"
              label="Type de zonage patrimonial"
              value={data.zonagePatrimonial}
              tooltip={
                <>
                  Données enrichies via les API Carto Nature et GPU de l'IGN :<br />
                  <a
                    href="https://apicarto.ign.fr/api/doc/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fr-link fr-text--xs"
                  >
                    apicarto.ign.fr/api/doc/
                  </a>
                </>
              }
            />
            <EnrichmentInfoField
              id="continuité-ecologique"
              label="Continuité écologique (trame verte et bleue)"
              value={data.tvb}
              tooltip="Pas de récupération pour l'instant"
            />
          </div>
        </div>
      </div>

      {/* Bouton "Suivant" à la fin de la zone d'enrichissement */}
      {onNext && (
        <div className="fr-mt-4w" style={{ textAlign: "right" }}>
          <button className="fr-btn" onClick={onNext} disabled={isLoadingNext}>
            Suivant
            <span className="fr-icon-arrow-right-s-line fr-icon--sm" aria-hidden="true"></span>
          </button>
        </div>
      )}
    </div>
  );
};
