import React, { useState } from "react";
import ParcelleSelector from "../parcelle-selector/ParcelleSelector";
import { ParcelleFeature } from "../parcelle-selector/types";

interface SelectParcelleByMapProps {
  onSelect: () => void;
}

export const SelectParcelleByMap: React.FC<SelectParcelleByMapProps> = ({ onSelect }) => {
  const [parcelleId, setParcelleId] = useState<string | null>(null);
  const [parcelleData, setParcelleData] = useState<ParcelleFeature | null>(null);

  const handleParcelleSelect = (id: string, parcelle: ParcelleFeature) => {
    console.log("Parcelle sélectionnée:", id);
    console.log("parcelleId :>> ", parcelleId);
    console.log("parcelleData :>> ", parcelleData);
    setParcelleId(id);
    setParcelleData(parcelle);

    // Ici Appel API pour enrichir les données
    // fetch(`/api/friches/enrichir`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ identifiant: id })
    // });
  };

  const handleMapClick = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    onSelect();
  };

  return (
    <div>
      <p className="fr-text--sm">
        Cliquez sur la carte pour sélectionner la (les) parcelle(s) à analyser
      </p>

      <ParcelleSelector
        onParcelleSelect={handleParcelleSelect}
        center={[47.2383, 6.0241]} // Besançon au lieu de Paris
        zoom={17}
        height="600px"
      />

      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12">
          <div
            style={{
              height: "400px",
              background: "linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)",
              border: "2px solid #18753c",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
            }}
            onClick={handleMapClick}
          >
            <div style={{ textAlign: "center", color: "#18753c" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🗺️</div>
              <p style={{ margin: 0, fontWeight: "bold" }}>Carte interactive</p>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>
                Cliquez pour sélectionner la parcelle "Atelier de conception - Coutances"
              </p>
            </div>

            <div
              style={{
                position: "absolute",
                top: "60%",
                left: "45%",
                width: "20px",
                height: "20px",
                background: "#000091",
                border: "3px solid white",
                borderRadius: "50%",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
              }}
              onClick={handleMapClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
