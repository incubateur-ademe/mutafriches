import React from "react";
import { MapLayerType } from "../../../../shared/config/map-layers.config";

interface MapLayerSelectorProps {
  activeLayer: MapLayerType;
  onLayerChange: (layer: MapLayerType) => void;
}

/**
 * Sélecteur de fond de carte avec design DSFR (Segmented Control)
 * Placé au-dessus de la carte
 */
export function MapLayerSelector({ activeLayer, onLayerChange }: MapLayerSelectorProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onLayerChange(event.target.value as MapLayerType);
  };

  return (
    <div className="map-layer-selector">
      <fieldset className="fr-segmented fr-segmented--sm">
        <legend className="fr-sr-only">Sélection du fond de carte</legend>
        <div className="fr-segmented__elements">
          <div className="fr-segmented__element">
            <input
              value="plan"
              checked={activeLayer === "plan"}
              type="radio"
              id="map-layer-plan"
              name="map-layer"
              onChange={handleChange}
            />
            <label className="fr-label fr-icon-road-map-line" htmlFor="map-layer-plan">
              Plan
            </label>
          </div>
          <div className="fr-segmented__element">
            <input
              value="orthophotos"
              checked={activeLayer === "orthophotos"}
              type="radio"
              id="map-layer-orthophotos"
              name="map-layer"
              onChange={handleChange}
            />
            <label className="fr-label fr-icon-earth-line" htmlFor="map-layer-orthophotos">
              Satellite
            </label>
          </div>
          <div className="fr-segmented__element">
            <input
              value="cadastre"
              checked={activeLayer === "cadastre"}
              type="radio"
              id="map-layer-cadastre"
              name="map-layer"
              onChange={handleChange}
            />
            <label className="fr-label fr-icon-map-pin-2-line" htmlFor="map-layer-cadastre">
              Cadastre
            </label>
          </div>
          <div className="fr-segmented__element">
            <input
              value="tous"
              checked={activeLayer === "tous"}
              type="radio"
              id="map-layer-tous"
              name="map-layer"
              onChange={handleChange}
            />
            <label className="fr-label fr-icon-stack-line" htmlFor="map-layer-tous">
              Tous
            </label>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
