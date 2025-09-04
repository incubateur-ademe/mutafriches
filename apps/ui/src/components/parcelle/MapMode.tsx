interface MapModeProps {
  onSelectParcel: (identifiant: string) => void;
}

export function MapMode({ onSelectParcel }: MapModeProps) {
  const handleMapClick = () => {
    // TODO: Remplacer par une vraie sélection sur carte
    const testParcelId = "50147000AR0010";
    onSelectParcel(testParcelId);
  };

  return (
    <div>
      <p className="fr-text--sm">
        Cliquez sur la carte pour sélectionner la (les) parcelle(s) à analyser
      </p>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12">
          {/* Carte fictive */}
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

            {/* Point de parcelle fictif */}
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
              onClick={(e) => {
                e.stopPropagation();
                handleMapClick();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
