import { useLeafletMap } from "../../../../shared/hooks/useLeafletMap";
import { useMapBaseLayers } from "../../../../shared/hooks/useMapBaseLayers";
import { useParcelleSelection } from "../../../../shared/hooks/useParcelleSelection";
import { useMapParcelleRenderer } from "../../../../shared/hooks/useMapParcelleRenderer";
import { AddressSearchBar } from "./AddressSearchBar";
import { MapLayerSelector } from "./MapLayerSelector";
import { MapGuide } from "./MapGuide";
import "./MapLayerSelector.css";
import "./MapGuide.css";
import "./ParcelleSelectionMap.css";
import "./ParcelleActions.css";

interface ParcelleSelectionMapProps {
  onAnalyze?: (identifiants: string[]) => void;
  height?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
}

const DEFAULT_CENTER: [number, number] = [47.4456, -0.4721]; // Centre par défaut : Trélazé

export function ParcelleSelectionMap({
  onAnalyze,
  height = "600px",
  initialCenter = DEFAULT_CENTER,
  initialZoom = 17,
}: ParcelleSelectionMapProps) {
  const MAP_CONTAINER_ID = "parcelle-selection-map";

  // Gestion du fond de carte actif
  const { activeLayer, setActiveLayer } = useMapBaseLayers();

  // Gestion de la sélection multi-parcelle
  const {
    selectedParcelles,
    previewParcelle,
    selectionState,
    parcelleCount,
    canAnalyze,
    handleParcelleClick,
    confirmAdd,
    removeParcelle,
    clearPreview,
    getSelectedIdus,
  } = useParcelleSelection();

  // Initialisation de la carte Leaflet
  const { flyToLocation, changeBaseLayer, mapRef } = useLeafletMap({
    containerId: MAP_CONTAINER_ID,
    initialCenter,
    initialZoom,
    baseLayer: activeLayer,
    onParcelleClick: handleParcelleClick,
    onEmptyClick: clearPreview,
  });

  // Synchronisation du rendu des parcelles sur la carte
  useMapParcelleRenderer({
    mapRef,
    selectedParcelles,
    previewParcelle,
    selectionState,
    onConfirmAdd: confirmAdd,
    onRemoveParcelle: removeParcelle,
  });

  const handleAddressSelected = (lat: number, lng: number) => {
    flyToLocation(lat, lng, 18);
  };

  const handleLayerChange = (newLayer: typeof activeLayer) => {
    setActiveLayer(newLayer);
    changeBaseLayer(newLayer);
  };

  const handleAnalyze = () => {
    if (onAnalyze && canAnalyze) {
      onAnalyze(getSelectedIdus());
    }
  };

  return (
    <div>
      {/* Barre de recherche */}
      <div className="fr-mb-3w">
        <AddressSearchBar onAddressSelected={handleAddressSelected} />
      </div>

      {/* Barre de contrôle : sélecteur de couches + bouton analyser */}
      <div className="map-toolbar fr-mb-3w">
        <MapLayerSelector activeLayer={activeLayer} onLayerChange={handleLayerChange} />
        <div className="map-toolbar__actions">
          {parcelleCount > 0 && (
            <span className="fr-text--sm fr-mt-3w  fr-text--bold map-toolbar__count">
              {parcelleCount} {parcelleCount > 1 ? "parcelles ajoutées" : "parcelle ajoutée"}
            </span>
          )}
          <button className="fr-btn" disabled={!canAnalyze} onClick={handleAnalyze}>
            Analyser ce site
          </button>
        </div>
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

        {/* Message guide en overlay sur la carte */}
        <MapGuide selectionState={selectionState} parcelleCount={parcelleCount} />
      </div>
    </div>
  );
}
