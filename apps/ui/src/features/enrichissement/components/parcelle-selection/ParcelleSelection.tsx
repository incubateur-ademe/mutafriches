import React, { useState } from "react";
import { ParcelleSelectionMap } from "../parcelle-map/ParcelleSelectionMap";
import { isValidParcelId } from "@mutafriches/shared-types";

interface ParcelleSelectionProps {
  onAnalyze?: (identifiant: string) => void;
}

export const ParcelleSelection: React.FC<ParcelleSelectionProps> = ({ onAnalyze }) => {
  const [selectedParcelId, setSelectedParcelId] = useState<string>("");

  const handleParcelSelectedOnMap = (parcelId: string) => {
    setSelectedParcelId(parcelId);
  };

  const handleAnalyze = () => {
    if (selectedParcelId && onAnalyze) {
      onAnalyze(selectedParcelId);
    }
  };

  const isAnalyzeDisabled = !selectedParcelId || !isValidParcelId(selectedParcelId);

  return (
    <div>
      <h2 className="fr-h4 fr-mb-3w">Sélection de la parcelle</h2>

      <ParcelleSelectionMap
        onParcelleSelected={(parcelId) => handleParcelSelectedOnMap(parcelId)}
        height="500px"
      />

      <div className="fr-mt-4w text-center">
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
