import React from "react";
import { ParcelleUiModel } from "../../../../shared/types/parcelle.models";
import { EnrichedInfoField } from "../common/EnrichedInfoField";

interface RisquesEnrichedDataProps {
  data: ParcelleUiModel;
}

/**
 * Affichage des donnees enrichies pour l'etape Risques
 * Ces donnees sont collectees automatiquement depuis les APIs publiques (GeoRisques, API Carto)
 */
export const RisquesEnrichedData: React.FC<RisquesEnrichedDataProps> = ({ data }) => {
  return (
    <div className="fr-mb-4w">
      <h2 className="fr-h4">Risques et zonages identifies</h2>
      <p className="fr-text--sm fr-mb-2w">
        Ces informations ont ete recuperees depuis les bases de donnees publiques (GeoRisques, API
        Carto IGN).
      </p>

      <div className="fr-grid-row fr-grid-row--gutters">
        <EnrichedInfoField
          id="presence-risques-technologiques"
          label="Presence de risques technologiques"
          value={data.risquesTechno}
          source="API GeoRisques"
          tooltip={
            <>
              Recupere depuis les donnees de l'API Georisques :<br />
              <a
                href="https://georisques.gouv.fr/doc-api"
                target="_blank"
                rel="noopener noreferrer"
                className="fr-link fr-text--xs"
              >
                georisques.gouv.fr/doc-api
              </a>
            </>
          }
        />

        <EnrichedInfoField
          id="presence-risques-naturels"
          label="Presence de risques naturels"
          value={data.risquesNaturels}
          source="API GeoRisques"
          tooltip={
            <>
              Recupere depuis les donnees de l'API Georisques :<br />
              <a
                href="https://www.georisques.gouv.fr/citoyen-recherche-map"
                target="_blank"
                rel="noopener noreferrer"
                className="fr-link fr-text--xs"
              >
                georisques.gouv.fr/citoyen-recherche-map
              </a>
              <br />
              <br />
              <em>
                En l'absence de la numerisation des plans de prevention des risques, cette donnee
                est susceptible d'etre faussee
              </em>
            </>
          }
        />

        <EnrichedInfoField
          id="type-zonage-environnemental"
          label="Type de zonage environnemental"
          value={data.zonageEnviro}
          source="API Carto Nature (IGN)"
          tooltip={
            <>
              Donnees enrichies via les API Carto Nature et GPU de l'IGN :<br />
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

        <EnrichedInfoField
          id="zonage-reglementaire"
          label="Zonage reglementaire"
          value={data.zonageUrba}
          source="API Carto GPU (IGN)"
          tooltip={
            <>
              Donnees enrichies via les API Carto Nature et GPU de l'IGN :<br />
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

        <EnrichedInfoField
          id="type-zonage-patrimonial"
          label="Type de zonage patrimonial"
          value={data.zonagePatrimonial}
          source="API Carto (IGN)"
          tooltip={
            <>
              Donnees enrichies via les API Carto Nature et GPU de l'IGN :<br />
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
      </div>
    </div>
  );
};
