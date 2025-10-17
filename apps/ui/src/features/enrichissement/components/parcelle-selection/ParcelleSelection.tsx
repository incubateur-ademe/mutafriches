import React, { useState } from "react";
import { SelectParcelleById } from "./SelectParcelleById";
import { ParcelleSelectionMap } from "../parcelle-map/ParcelleSelectionMap";

interface ParcelleSelectionProps {
  onAnalyze?: (identifiant: string) => void;
}

export const ParcelleSelection: React.FC<ParcelleSelectionProps> = ({ onAnalyze }) => {
  const [selectedParcelId, setSelectedParcelId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"id" | "map">("map");

  const handleTabClick = (tab: "id" | "map") => {
    setActiveTab(tab);
  };

  const handleParcelIdChange = (identifiant: string) => {
    setSelectedParcelId(identifiant);
  };

  const handleParcelSelectedOnMap = (parcelId: string) => {
    setSelectedParcelId(parcelId);
  };

  const handleSwitchToMap = () => {
    setActiveTab("map");
  };

  const handleAnalyze = () => {
    if (selectedParcelId && onAnalyze) {
      onAnalyze(selectedParcelId);
    }
  };

  const isAnalyzeDisabled = !selectedParcelId || selectedParcelId.length < 14;

  return (
    <div>
      <h2 className="fr-h4 fr-mb-3w">Sélection de la parcelle</h2>

      <div className="fr-tabs">
        <ul className="fr-tabs__list" role="tablist" aria-label="Méthodes de sélection de parcelle">
          <li role="presentation">
            <button
              type="button"
              id="tab-map"
              className="fr-tabs__tab"
              tabIndex={activeTab === "map" ? 0 : -1}
              role="tab"
              aria-selected={activeTab === "map"}
              aria-controls="tab-map-panel"
              onClick={() => handleTabClick("map")}
            >
              Recherche par carte
            </button>
          </li>
          <li role="presentation">
            <button
              type="button"
              id="tab-id"
              className="fr-tabs__tab"
              tabIndex={activeTab === "id" ? 0 : -1}
              role="tab"
              aria-selected={activeTab === "id"}
              aria-controls="tab-id-panel"
              onClick={() => handleTabClick("id")}
            >
              Rechercher par identifiant cadastral (IDU)
            </button>
          </li>
        </ul>

        <div
          id="tab-map-panel"
          className={`fr-tabs__panel ${activeTab === "map" ? "fr-tabs__panel--selected" : ""}`}
          role="tabpanel"
          aria-labelledby="tab-map"
          tabIndex={0}
        >
          <ParcelleSelectionMap
            onParcelleSelected={(parcelId) => handleParcelSelectedOnMap(parcelId)}
            height="500px"
          />
        </div>

        <div
          id="tab-id-panel"
          className={`fr-tabs__panel ${activeTab === "id" ? "fr-tabs__panel--selected" : ""}`}
          role="tabpanel"
          aria-labelledby="tab-id"
          tabIndex={0}
        >
          <SelectParcelleById
            onParcelleIdChange={handleParcelIdChange}
            onSwitchToMap={handleSwitchToMap}
          />
        </div>
      </div>

      <div className="fr-mt-4w" style={{ textAlign: "center" }}>
        <button
          className="fr-btn fr-btn--lg fr-btn--icon-left fr-icon-bar-chart-box-line"
          type="button"
          onClick={handleAnalyze}
          disabled={isAnalyzeDisabled}
        >
          Analyser la mutabilité de cette parcelle
        </button>

        {isAnalyzeDisabled && (
          <p className="fr-text--sm fr-mt-2w" style={{ color: "#666" }}>
            Veuillez sélectionner une parcelle pour lancer l&apos;analyse
          </p>
        )}
      </div>
    </div>
  );
};
