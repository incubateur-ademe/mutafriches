import React from "react";
import { MapLayerType } from "../../../../shared/config/map-layers.config";

interface MapLayerSelectorProps {
  activeLayer: MapLayerType;
  onLayerChange: (layer: MapLayerType) => void;
  isStacked: boolean;
  onStackedChange: (stacked: boolean) => void;
}

/**
 * Sélecteur de fond de carte avec design DSFR (Segmented Control)
 * Positionné en overlay en haut à droite de la carte
 */
export function MapLayerSelector({
  activeLayer,
  onLayerChange,
  isStacked,
  onStackedChange,
}: MapLayerSelectorProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onLayerChange(event.target.value as MapLayerType);
  };

  const handleStackedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onStackedChange(event.target.checked);
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
              disabled={isStacked}
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
              disabled={isStacked}
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
              disabled={isStacked}
            />
            <label className="fr-label fr-icon-map-pin-2-line" htmlFor="map-layer-cadastre">
              Cadastre
            </label>
          </div>
        </div>
      </fieldset>

      {/* Case à cocher pour la superposition */}
      <div className="fr-checkbox-group fr-checkbox-group--sm fr-mt-1w">
        <input
          type="checkbox"
          id="map-layer-stack"
          checked={isStacked}
          onChange={handleStackedChange}
        />
        <label className="fr-label" htmlFor="map-layer-stack">
          Empiler les couches
        </label>
      </div>
    </div>
  );
}
