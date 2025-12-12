import { useLeafletMap } from "../../../../shared/hooks/useLeafletMap";
import { OnParcelleSelectedCallback } from "../../../../shared/types/callbacks.types";
import { AddressSearchBar } from "./AddressSearchBar";

interface ParcelleSelectionMapProps {
  onParcelleSelected?: OnParcelleSelectedCallback;
  height?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
}

const DEFAULT_CENTER: [number, number] = [47.4456, -0.4721];

export function ParcelleSelectionMap({
  onParcelleSelected,
  height = "600px",
  initialCenter = DEFAULT_CENTER,
  initialZoom = 17,
}: ParcelleSelectionMapProps) {
  const MAP_CONTAINER_ID = "parcelle-selection-map";

  const { flyToLocation } = useLeafletMap({
    containerId: MAP_CONTAINER_ID,
    initialCenter,
    initialZoom,
    onParcelleSelected,
  });

  const handleAddressSelected = (lat: number, lng: number) => {
    flyToLocation(lat, lng, 18);
  };

  return (
    <div>
      {/* Barre de recherche */}
      <div className="fr-mb-3w">
        <AddressSearchBar onAddressSelected={handleAddressSelected} />
      </div>

      {/* Carte avec style arrondi */}
      <div
        style={{
          width: "100%",
          height,
          position: "relative",
          border: "2px solid #000091",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div id={MAP_CONTAINER_ID} style={{ height: "100%", width: "100%" }} />
      </div>
    </div>
  );
}
