import React from "react";
import { UiParcelleDto } from "@mutafriches/shared-types";

interface EnrichmentDisplayProps {
  data: UiParcelleDto | null;
}

export const EnrichmentDisplay: React.FC<EnrichmentDisplayProps> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="fr-mt-4w">
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
            <InfoField
              id="commune"
              label="Commune"
              value={data.commune}
              tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            />
            <InfoField
              id="identifiant-parcelle"
              label="Identifiant parcelle"
              value={data.identifiantParcelle}
              tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            />
            <InfoField
              id="surface-site"
              label="Surface du site"
              value={data.surfaceParcelle}
              tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            />
            <InfoField
              id="surface-batie"
              label="Surface bâtie"
              value={data.surfaceBatie}
              tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            />
            <InfoField
              id="connection-electricite"
              label="Connection au réseau d'électricité"
              value={data.connectionElectricite}
              tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            />
            <InfoField
              id="ancienne-activite"
              label="Ancienne activité"
              value={data.ancienneActivite}
              tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
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
            <InfoField
              id="site-centre-ville"
              label="Site en centre ville"
              value={data.centreVille}
              tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            />
            <InfoField
              id="distance-voie-grande-circulation"
              label="Distance voie à grande circulation"
              value={data.distanceAutoroute}
              tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            />
            <InfoField
              id="distance-transport-commun"
              label="Distance au transport en commun"
              value={data.distanceTrain}
              tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            />
            <InfoField
              id="proximite-commerces-services"
              label="Proximité des commerces et services"
              value={data.proximiteCommerces}
              tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            />
            <InfoField
              id="distance-raccordement-electrique"
              label="Distance au raccordement électrique"
              value={data.distanceRaccordement}
              tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            />
            <InfoField
              id="taux-logements-vacants"
              label="Taux de logements vacants"
              value={data.tauxLV}
              tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
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
            <InfoField
              id="presence-risques-technologiques"
              label="Présence de risques technologiques"
              value={data.risquesTechno}
              tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            />
            <InfoField
              id="presence-risques-naturels"
              label="Présence de risques naturels"
              value={data.risquesNaturels}
              tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            />
            <InfoField
              id="type-zonage-environnemental"
              label="Type de zonage environnemental"
              value={data.zonageEnviro}
              tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            />

            <InfoField
              id="zonage-reglementaire"
              label="Zonage réglementaire"
              value={data.zonageUrba}
              tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            />
            <InfoField
              id="type-zonage-patrimonial"
              label="Type de zonage patrimonial"
              value={data.zonagePatrimonial}
              tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            />
            <InfoField
              id="continuité-ecologique"
              label="Continuité écologique (trame verte et bleue)"
              value={data.tvb}
              tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour afficher un champ d'information
const InfoField: React.FC<{ id: string; label: string; value: string; tooltip: string }> = ({
  id,
  label,
  value,
  tooltip,
}) => {
  const isVerified = value !== "Non renseigné";

  return (
    <div className="fr-col-6">
      <div className="fr-text fr-text--lg">
        <strong>{label}</strong>
        <button aria-describedby={`tooltip-${id}`} type="button" className="fr-btn--tooltip fr-btn">
          <span className="fr-icon-information-line" aria-hidden="true"></span>
        </button>
        <span className="fr-tooltip fr-placement" id={`tooltip-${id}`} role="tooltip">
          {tooltip}
        </span>
        <br />
        <span
          className={isVerified ? "fr-badge fr-badge--blue-france" : "fr-badge fr-badge--no-icon"}
        >
          {value}
        </span>
      </div>
    </div>
  );
};
