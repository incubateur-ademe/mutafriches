import React from "react";
import { ParcelleUiModel } from "../../../../shared/types/parcelle.models";
import { EnrichedInfoField } from "../common/EnrichedInfoField";

interface EnvironnementEnrichedDataProps {
  data: ParcelleUiModel;
}

/**
 * Affichage des donnees enrichies pour l'etape Environnement
 * Ces donnees sont collectees automatiquement depuis les APIs publiques
 */
export const EnvironnementEnrichedData: React.FC<EnvironnementEnrichedDataProps> = ({ data }) => {
  return (
    <div className="fr-mb-4w">
      <h2 className="fr-h4">Donnees collectees automatiquement</h2>
      <p className="fr-text--sm fr-mb-2w">
        Ces informations ont ete recuperees depuis les bases de donnees publiques.
      </p>

      <div className="fr-grid-row fr-grid-row--gutters">
        <EnrichedInfoField
          id="site-centre-ville"
          label="Site en centre ville"
          value={data.centreVille}
          source="API Annuaire Service public"
          tooltip={
            <>
              Recupere depuis l'API de l'annuaire du Service public :<br />
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

        <EnrichedInfoField
          id="distance-voie-grande-circulation"
          label="Distance voie a grande circulation"
          value={data.distanceAutoroute}
          source="API IGN Geoplateforme"
          tooltip={
            <>
              Recupere depuis l'API IGN Geoplateforme WFS :<br />
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

        <EnrichedInfoField
          id="distance-transport-commun"
          label="Distance au transport en commun"
          value={data.distanceTransportsEnCommun}
          source="Transport.data.gouv.fr"
          tooltip={
            <>
              Recupere depuis le jeu de donnees de Transport.data.gouv.fr :<br />
              <a
                href="https://transport.data.gouv.fr/datasets/arrets-de-transport-en-france"
                target="_blank"
                rel="noopener noreferrer"
                className="fr-link fr-text--xs"
              >
                transport.data.gouv.fr/datasets/arrets-de-transport-en-france
              </a>
            </>
          }
        />

        <EnrichedInfoField
          id="proximite-commerces-services"
          label="Proximite des commerces et services"
          value={data.proximiteCommerces}
          source="INSEE BPE"
          tooltip={
            <>
              Recupere depuis la base permanente des equipements (BPE) :<br />
              <a
                href="https://www.insee.fr/fr/metadonnees/source/serie/s1161"
                target="_blank"
                rel="noopener noreferrer"
                className="fr-link fr-text--xs"
              >
                insee.fr/fr/metadonnees/source/serie/s1161
              </a>
            </>
          }
        />

        <EnrichedInfoField
          id="distance-raccordement-electrique"
          label="Distance au raccordement electrique"
          value={data.distanceRaccordement}
          source="API Enedis"
          tooltip={
            <>
              Recupere depuis l'API Enedis :<br />
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

        <EnrichedInfoField
          id="taux-logements-vacants"
          label="Taux de logements vacants"
          value={data.tauxLV}
          source="Data.gouv.fr"
          tooltip={
            <>
              Recupere depuis l'API tabulaire de data.gouv.fr :<br />
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
  );
};
