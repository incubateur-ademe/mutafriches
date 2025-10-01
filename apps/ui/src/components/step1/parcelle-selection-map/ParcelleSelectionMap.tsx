import { useLeafletMap } from "../../../hooks/useLeafletMap";
import { OnParcelleSelectedCallback } from "../../../types/parcelle.types";
import { AddressSearchBar } from "./AddressSearchBar";

interface ParcelleSelectionMapProps {
  onParcelleSelected?: OnParcelleSelectedCallback;
  height?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
}

// Centre par défaut
const DEFAULT_CENTER: [number, number] = [47.4456, -0.4721];

export function ParcelleSelectionMap({
  onParcelleSelected,
  height = "600px",
  initialCenter = DEFAULT_CENTER,
  initialZoom = 17,
}: ParcelleSelectionMapProps) {
  const MAP_CONTAINER_ID = "parcelle-selection-map";

  // Hook d'initialisation de la carte
  const { flyToLocation } = useLeafletMap({
    containerId: MAP_CONTAINER_ID,
    initialCenter,
    initialZoom,
    onParcelleSelected,
  });

  const handleAddressSelected = (lat: number, lng: number) => {
    flyToLocation(lat, lng, 18); // Zoom à 18 pour voir les parcelles
  };

  return (
    <div style={{ width: "100%", height, position: "relative" }}>
      {/* Barre de recherche d'adresse */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 1000,
        }}
      >
        <AddressSearchBar onAddressSelected={handleAddressSelected} />
      </div>

      {/* Conteneur de la carte */}
      <div id={MAP_CONTAINER_ID} style={{ height: "100%", width: "100%" }} />

      {/* Panneau d'information (à droite) */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "white",
          padding: "15px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          zIndex: 1000,
          maxWidth: "300px",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>Sélecteur de Parcelles</h3>
        <p style={{ margin: "5px 0", fontSize: "14px", color: "#666" }}>
          Recherchez une adresse ou cliquez sur la carte
        </p>
      </div>
    </div>
  );
}
