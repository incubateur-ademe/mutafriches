import React, { useState } from "react";
import { UiParcelleDto } from "@mutafriches/shared-types";

interface EnrichmentDisplayProps {
  data: UiParcelleDto | null;
  sources?: string[];
  fiabilite?: number;
}

export const EnrichmentDisplay: React.FC<EnrichmentDisplayProps> = ({
  data,
  sources,
  fiabilite,
}) => {
  const [activeTab, setActiveTab] = useState<"infos" | "env" | "risques">("infos");

  if (!data) return null;

  return (
    <div className="fr-mt-4w">
      <hr />
      <h3>Données publiques sourcées</h3>
      <p className="fr-text--sm">
        Ces informations ont été collectées automatiquement depuis les bases de données publiques,
        assurez-vous qu'elles soient correctes.
      </p>

      {fiabilite && (
        <div className="fr-mb-2w">
          <span className="fr-badge fr-badge--info">Fiabilité: {fiabilite}/10</span>
        </div>
      )}

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
              className={`fr-tabs__tab ${activeTab === "infos" ? "fr-tabs__tab--selected" : ""}`}
              tabIndex={activeTab === "infos" ? 0 : -1}
              role="tab"
              aria-selected={activeTab === "infos"}
              aria-controls="tab-infos-panel"
              onClick={() => setActiveTab("infos")}
            >
              Informations du site
            </button>
          </li>
          <li role="presentation">
            <button
              type="button"
              className={`fr-tabs__tab ${activeTab === "env" ? "fr-tabs__tab--selected" : ""}`}
              tabIndex={activeTab === "env" ? 0 : -1}
              role="tab"
              aria-selected={activeTab === "env"}
              aria-controls="tab-env-panel"
              onClick={() => setActiveTab("env")}
            >
              Environnement du site
            </button>
          </li>
          <li role="presentation">
            <button
              type="button"
              className={`fr-tabs__tab ${activeTab === "risques" ? "fr-tabs__tab--selected" : ""}`}
              tabIndex={activeTab === "risques" ? 0 : -1}
              role="tab"
              aria-selected={activeTab === "risques"}
              aria-controls="tab-risques-panel"
              onClick={() => setActiveTab("risques")}
            >
              Risques & zonage
            </button>
          </li>
        </ul>

        {/* Panneau Infos parcelle */}
        {activeTab === "infos" && (
          <div className="fr-tabs__panel fr-tabs__panel--selected" role="tabpanel">
            <div className="fr-grid-row fr-grid-row--gutters">
              <InfoField label="Commune" value={data.commune} />
              <InfoField label="Identifiant parcelle" value={data.identifiantParcelle} />
              <InfoField label="Surface du site" value={data.surfaceParcelle} />
              <InfoField label="Surface bâtie" value={data.surfaceBatie} />
              <InfoField
                label="Connection au réseau d'électricité"
                value={data.connectionElectricite}
              />
              <InfoField label="Ancienne activité" value={data.ancienneActivite} />
            </div>
          </div>
        )}

        {/* Panneau Environnement */}
        {activeTab === "env" && (
          <div className="fr-tabs__panel fr-tabs__panel--selected" role="tabpanel">
            <div className="fr-grid-row fr-grid-row--gutters">
              <InfoField label="Site en centre ville" value={data.centreVille} />
              <InfoField
                label="Distance voie à grande circulation"
                value={data.distanceAutoroute}
              />
              <InfoField label="Distance au transport en commun" value={data.distanceTrain} />
              <InfoField
                label="Proximité des commerces et services"
                value={data.proximiteCommerces}
              />
              <InfoField
                label="Distance au raccordement électrique"
                value={data.distanceRaccordement}
              />
              <InfoField label="Taux de logements vacants" value={data.tauxLV} />
            </div>
          </div>
        )}

        {/* Panneau Risques */}
        {activeTab === "risques" && (
          <div className="fr-tabs__panel fr-tabs__panel--selected" role="tabpanel">
            <div className="fr-grid-row fr-grid-row--gutters">
              <InfoField label="Présence de risques technologiques" value={data.risquesTechno} />
              <InfoField label="Présence de risques naturels" value={data.risquesNaturels} />
              <InfoField label="Type de zonage environnemental" value={data.zonageEnviro} />
              <InfoField label="Zonage réglementaire" value={data.zonageUrba} />
              <InfoField label="Type de zonage patrimonial" value={data.zonagePatrimonial} />
              <InfoField label="Continuité écologique (trame verte et bleue)" value={data.tvb} />
            </div>
          </div>
        )}
      </div>

      {/* Sources utilisées */}
      {sources && sources.length > 0 && (
        <div className="fr-mt-3w">
          <h6>Sources utilisées :</h6>
          <ul className="fr-text--sm">
            {sources.map((source, index) => (
              <li key={index}>{source}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Composant pour afficher un champ d'information
const InfoField: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const isVerified = value !== "Non renseigné";

  return (
    <div className="fr-col-6">
      <div className="fr-text fr-text--lg">
        <strong>{label}</strong>
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
