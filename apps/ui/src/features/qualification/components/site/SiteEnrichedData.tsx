import React from "react";
import { ParcelleUiModel } from "../../../../shared/types/parcelle.models";
import { EnrichedInfoField } from "../common/EnrichedInfoField";

interface SiteEnrichedDataProps {
  data: ParcelleUiModel;
}

/**
 * Affichage des donnees enrichies pour l'etape Site
 * Ces donnees sont collectees automatiquement depuis les APIs publiques
 */
export const SiteEnrichedData: React.FC<SiteEnrichedDataProps> = ({ data }) => {
  return (
    <div className="fr-mb-4w">
      <h2 className="fr-h4">Donnees collectees automatiquement</h2>
      <p className="fr-text--sm fr-mb-2w">
        Ces informations ont ete recuperees depuis les bases de donnees publiques.
      </p>

      <div className="fr-grid-row fr-grid-row--gutters">
        <EnrichedInfoField
          id="commune"
          label="Commune"
          value={data.commune}
          source="API IGN Cadastre"
          tooltip={
            <>
              Recupere depuis l'API IGN Cadastre :<br />
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

        <EnrichedInfoField
          id="identifiant-parcelle"
          label="Identifiant parcelle"
          value={data.identifiantParcelle}
          source="API IGN Cadastre"
          tooltip={
            <>
              Recupere depuis l'API IGN Cadastre :<br />
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

        <EnrichedInfoField
          id="surface-site"
          label="Surface du site"
          value={data.surfaceParcelle}
          source="API IGN Cadastre"
          tooltip={
            <>
              Recupere depuis l'API IGN Cadastre :<br />
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

        <EnrichedInfoField
          id="surface-batie"
          label="Surface batie"
          value={data.surfaceBatie}
          source="API BDNB"
          tooltip={
            <>
              Recupere depuis l'API BDNB :<br />
              <a
                href="https://api-portail.bdnb.io"
                target="_blank"
                rel="noopener noreferrer"
                className="fr-link fr-text--xs"
              >
                api-portail.bdnb.io
              </a>
            </>
          }
        />
      </div>
    </div>
  );
};
