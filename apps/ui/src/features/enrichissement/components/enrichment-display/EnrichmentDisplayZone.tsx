import React from "react";
import { EnrichmentInfoField } from "./EnrichmentInfoField";
import { UiParcelleDto } from "../../../../shared/types/ui.types";

interface EnrichmentDisplayZoneProps {
  data: UiParcelleDto | null;
}

export const EnrichmentDisplayZone: React.FC<EnrichmentDisplayZoneProps> = ({ data }) => {
  if (!data) return null;

  return (
    <div id="enrichment-display-zone" className="fr-mt-4w">
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
              tooltip="Récupéré depuis API IGN Cadastre : https://apicarto.ign.fr/api/doc/cadastre"
            />
            <EnrichmentInfoField
              id="identifiant-parcelle"
              label="Identifiant parcelle"
              value={data.identifiantParcelle}
              tooltip="Récupéré depuis API IGN Cadastre : https://apicarto.ign.fr/api/doc/cadastre"
            />
            <EnrichmentInfoField
              id="surface-site"
              label="Surface du site"
              value={data.surfaceParcelle}
              tooltip="Récupéré depuis API IGN Cadastre : https://apicarto.ign.fr/api/doc/cadastre"
            />
            <EnrichmentInfoField
              id="surface-batie"
              label="Surface bâtie"
              value={data.surfaceBatie}
              tooltip="Récupéré depuis API BDNB : https://api.bdnb.io/v1/bdnb"
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
              tooltip="Donnée de test, pas de récupération réelle pour l'instant"
            />
            <EnrichmentInfoField
              id="distance-voie-grande-circulation"
              label="Distance voie à grande circulation"
              value={data.distanceAutoroute}
              tooltip="Donnée de test, pas de récupération réelle pour l'instant"
            />
            <EnrichmentInfoField
              id="distance-transport-commun"
              label="Distance au transport en commun"
              value={data.distanceTrain}
              tooltip="Donnée de test, pas de récupération réelle pour l'instant"
            />
            <EnrichmentInfoField
              id="proximite-commerces-services"
              label="Proximité des commerces et services"
              value={data.proximiteCommerces}
              tooltip="Donnée de test, pas de récupération réelle pour l'instant"
            />
            <EnrichmentInfoField
              id="distance-raccordement-electrique"
              label="Distance au raccordement électrique"
              value={data.distanceRaccordement}
              tooltip="Récupéré depuis API Enedis : https://data.enedis.fr/api/explore/v2.1/catalog/datasets"
            />
            <EnrichmentInfoField
              id="taux-logements-vacants"
              label="Taux de logements vacants"
              value={data.tauxLV}
              tooltip="Donnée de test, pas de récupération réelle pour l'instant"
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
              tooltip="Donnée de test, pas de récupération réelle pour l'instant"
            />
            <EnrichmentInfoField
              id="presence-risques-naturels"
              label="Présence de risques naturels"
              value={data.risquesNaturels}
              tooltip="Récupéré depuis API BDNB : https://api.bdnb.io/v1/bdnb"
            />
            <EnrichmentInfoField
              id="type-zonage-environnemental"
              label="Type de zonage environnemental"
              value={data.zonageEnviro}
              tooltip="Donnée de test, pas de récupération réelle pour l'instant"
            />
            <EnrichmentInfoField
              id="zonage-reglementaire"
              label="Zonage réglementaire"
              value={data.zonageUrba}
              tooltip="Donnée de test, pas de récupération réelle pour l'instant"
            />
            <EnrichmentInfoField
              id="type-zonage-patrimonial"
              label="Type de zonage patrimonial"
              value={data.zonagePatrimonial}
              tooltip="Donnée de test, pas de récupération réelle pour l'instant"
            />
            <EnrichmentInfoField
              id="continuité-ecologique"
              label="Continuité écologique (trame verte et bleue)"
              value={data.tvb}
              tooltip="Donnée de test, pas de récupération réelle pour l'instant"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
