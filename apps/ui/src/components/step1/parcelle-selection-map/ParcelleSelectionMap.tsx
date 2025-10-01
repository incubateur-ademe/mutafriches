import { useLeafletMap } from "../../../hooks/useLeafletMap";
import { OnParcelleSelectedCallback } from "../../../types/parcelle.types";

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
  useLeafletMap({
    containerId: MAP_CONTAINER_ID,
    initialCenter,
    initialZoom,
    onParcelleSelected,
  });

  return (
    <div style={{ width: "100%", height, position: "relative" }}>
      {/* Conteneur de la carte */}
      <div id={MAP_CONTAINER_ID} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
