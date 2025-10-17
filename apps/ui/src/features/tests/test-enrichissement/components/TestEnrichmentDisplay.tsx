import React, { useState } from "react";
import type { EnrichissementOutputDto } from "@mutafriches/shared-types";
import { SourceEnrichissement, hasSource, hasGeoRisquesData } from "@mutafriches/shared-types";
import { GeoRisquesTable } from "./georisques/GeoRisquesTable";

interface TestEnrichmentDisplayProps {
  data: EnrichissementOutputDto;
}

export const TestEnrichmentDisplay: React.FC<TestEnrichmentDisplayProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<string>("metadata");

  // Déterminer les onglets disponibles selon les sources
  const availableTabs = [
    {
      id: "metadata",
      label: "Métadonnées",
      visible: true,
    },
    {
      id: "cadastre",
      label: "Cadastre IGN",
      visible: hasSource(data.sourcesUtilisees, SourceEnrichissement.CADASTRE),
    },
    {
      id: "bdnb",
      label: "BDNB",
      visible:
        hasSource(data.sourcesUtilisees, SourceEnrichissement.BDNB) ||
        hasSource(data.sourcesUtilisees, SourceEnrichissement.BDNB_RISQUES),
    },
    {
      id: "enedis",
      label: "Enedis",
      visible: hasSource(data.sourcesUtilisees, SourceEnrichissement.ENEDIS_RACCORDEMENT),
    },
    {
      id: "transport",
      label: "Transport",
      visible: hasSource(data.sourcesUtilisees, SourceEnrichissement.TRANSPORT),
    },
    {
      id: "georisques",
      label: "GéoRisques",
      visible: hasGeoRisquesData(data.sourcesUtilisees) || !!data.risquesGeorisques,
    },
  ].filter((tab) => tab.visible);

  return (
    <div className="fr-mt-4w">
      <hr />
      <h3>Résultats de l'enrichissement</h3>

      {/* Infos rapides */}
      <div className="fr-callout fr-callout--blue-ecume fr-mb-3w">
        <p className="fr-callout__text">
          <strong>Parcelle :</strong> {data.identifiantParcelle}
          <br />
          <strong>Commune :</strong> {data.commune} ({data.codeInsee})<br />
          <strong>Fiabilité :</strong> {data.fiabilite}/10
          <br />
          <strong>Sources utilisées :</strong> {data.sourcesUtilisees?.length || 0} source(s)
        </p>
      </div>

      {/* Onglets */}
      <div className="fr-tabs">
        <ul className="fr-tabs__list" role="tablist">
          {availableTabs.map((tab) => (
            <li key={tab.id} role="presentation">
              <button
                type="button"
                id={`tab-${tab.id}`}
                className="fr-tabs__tab"
                tabIndex={activeTab === tab.id ? 0 : -1}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tab-${tab.id}-panel`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Panneau Métadonnées */}
        <div
          id="tab-metadata-panel"
          className={`fr-tabs__panel ${activeTab === "metadata" ? "fr-tabs__panel--selected" : ""}`}
          role="tabpanel"
          aria-labelledby="tab-metadata"
          tabIndex={0}
        >
          <h4>Métadonnées de l'enrichissement</h4>

          {/* Section Sources */}
          <div className="fr-grid-row fr-grid-row--gutters fr-mt-2w">
            {/* Sources utilisées */}
            <div className="fr-col-12 fr-col-md-6">
              <div className="fr-card fr-card--no-border">
                <div className="fr-card__body">
                  <div className="fr-card__content">
                    <h4 className="fr-card__title">Sources utilisées</h4>
                    <div className="fr-card__desc">
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {data.sourcesUtilisees?.map((source) => (
                          <p key={source} className="fr-badge fr-badge--success">
                            {source}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Champs manquants */}
            <div className="fr-col-12 fr-col-md-6">
              <div className="fr-card fr-card--no-border">
                <div className="fr-card__body">
                  <div className="fr-card__content">
                    <h4 className="fr-card__title">Champs manquants</h4>
                    <div className="fr-card__desc">
                      {data.champsManquants && data.champsManquants.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                          {data.champsManquants.map((champ) => (
                            <p key={champ} className="fr-badge fr-badge--warning">
                              {champ}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="fr-text--sm">Tous les champs ont été enrichis</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Fiabilité */}
          <div className="fr-mb-3w">
            <h5>Indice de fiabilité</h5>
            <div
              className={`fr-callout ${
                data.fiabilite >= 8
                  ? "fr-callout--green-emeraude"
                  : data.fiabilite >= 6
                    ? "fr-callout--blue-ecume"
                    : data.fiabilite >= 4
                      ? "fr-callout--yellow-moutarde"
                      : "fr-callout--pink-tuile"
              }`}
            >
              <p className="fr-callout__text">
                <strong style={{ fontSize: "1.5rem" }}>{data.fiabilite}/10</strong>
                <br />
                <span className="fr-text--sm">
                  {data.fiabilite >= 8 && "Excellent - Données très fiables"}
                  {data.fiabilite >= 6 && data.fiabilite < 8 && "Bon - Données fiables"}
                  {data.fiabilite >= 4 &&
                    data.fiabilite < 6 &&
                    "Moyen - Quelques données manquantes"}
                  {data.fiabilite < 4 && "Faible - Beaucoup de données manquantes"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Panneau Cadastre */}
        <div
          id="tab-cadastre-panel"
          className={`fr-tabs__panel ${activeTab === "cadastre" ? "fr-tabs__panel--selected" : ""}`}
          role="tabpanel"
          aria-labelledby="tab-cadastre"
          tabIndex={0}
        >
          <h4>Données Cadastre IGN</h4>
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-6">
              <p>
                <strong>Identifiant :</strong> {data.identifiantParcelle}
              </p>
              <p>
                <strong>Commune :</strong> {data.commune}
              </p>
              <p>
                <strong>Code INSEE :</strong> {data.codeInsee}
              </p>
              <p>
                <strong>Surface :</strong> {data.surfaceSite.toLocaleString("fr-FR")} m²
              </p>
            </div>
            <div className="fr-col-6">
              {data.coordonnees && (
                <>
                  <p>
                    <strong>Latitude :</strong> {data.coordonnees.latitude.toFixed(6)}
                  </p>
                  <p>
                    <strong>Longitude :</strong> {data.coordonnees.longitude.toFixed(6)}
                  </p>
                </>
              )}
            </div>
          </div>

          {data.geometrie && (
            <>
              <h5 className="fr-mt-3w">Géométrie</h5>
              <pre
                style={{
                  backgroundColor: "#f6f6f6",
                  padding: "1rem",
                  borderRadius: "0.25rem",
                  overflow: "auto",
                  maxHeight: "400px",
                  fontSize: "0.875rem",
                }}
              >
                {JSON.stringify(data.geometrie, null, 2)}
              </pre>
            </>
          )}
        </div>

        {/* Panneau BDNB */}
        <div
          id="tab-bdnb-panel"
          className={`fr-tabs__panel ${activeTab === "bdnb" ? "fr-tabs__panel--selected" : ""}`}
          role="tabpanel"
          aria-labelledby="tab-bdnb"
          tabIndex={0}
        >
          <h4>Données BDNB</h4>
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-6">
              <p>
                <strong>Surface bâtie :</strong>{" "}
                {data.surfaceBati
                  ? `${data.surfaceBati.toLocaleString("fr-FR")} m²`
                  : "Non disponible"}
              </p>
            </div>
            <div className="fr-col-6">
              <p>
                <strong>Risques naturels :</strong>{" "}
                {data.presenceRisquesNaturels || "Non disponible"}
              </p>
            </div>
          </div>
        </div>

        {/* Panneau Enedis */}
        <div
          id="tab-enedis-panel"
          className={`fr-tabs__panel ${activeTab === "enedis" ? "fr-tabs__panel--selected" : ""}`}
          role="tabpanel"
          aria-labelledby="tab-enedis"
          tabIndex={0}
        >
          <h4>Données Enedis</h4>
          <p>
            <strong>Distance raccordement électrique :</strong>{" "}
            {data.distanceRaccordementElectrique.toFixed(2)} m
          </p>
        </div>

        {/* Panneau Transport */}
        <div
          id="tab-transport-panel"
          className={`fr-tabs__panel ${activeTab === "transport" ? "fr-tabs__panel--selected" : ""}`}
          role="tabpanel"
          aria-labelledby="tab-transport"
          tabIndex={0}
        >
          <h4>Données Transport</h4>
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-6">
              <p>
                <strong>Site en centre-ville :</strong> {data.siteEnCentreVille ? "Oui" : "Non"}
              </p>
              <p>
                <strong>Distance autoroute :</strong> {data.distanceAutoroute.toFixed(2)} km
              </p>
            </div>
            <div className="fr-col-6">
              <p>
                <strong>Distance transport en commun :</strong>{" "}
                {data.distanceTransportCommun.toFixed(2)} m
              </p>
              <p>
                <strong>Commerces/services à proximité :</strong>{" "}
                {data.proximiteCommercesServices ? "Oui" : "Non"}
              </p>
            </div>
          </div>
        </div>

        {/* Panneau GéoRisques */}
        <div
          id="tab-georisques-panel"
          className={`fr-tabs__panel ${activeTab === "georisques" ? "fr-tabs__panel--selected" : ""}`}
          role="tabpanel"
          aria-labelledby="tab-georisques"
          tabIndex={0}
        >
          <h4>Données GéoRisques structurées</h4>
          <GeoRisquesTable data={data.risquesGeorisques} />
        </div>
      </div>
    </div>
  );
};
