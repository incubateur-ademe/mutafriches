import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import L from "leaflet";
import type { GeoJsonObject } from "geojson";
import { Coordonnees, GeometrieParcelle } from "@mutafriches/shared-types";
import { useLeafletMap } from "@shared/hooks/useLeafletMap";
import { MapLayerType } from "@shared/config/map-layers.config";
import { MapLayerSelector } from "@features/analyser/components/parcelle-map/MapLayerSelector";
import "@features/analyser/components/parcelle-map/MapLayerSelector.css";

interface SiteMapProps {
  geometrie: GeometrieParcelle; // emprise du site (union des parcelles)
  centre?: Coordonnees; // centroïde pour le centrage initial
  height?: string;
}

// Style du contour du site (bleu France, cohérent avec la carte de sélection)
const SITE_STYLE: L.PathOptions = {
  color: "#000091",
  weight: 2,
  fillColor: "#000091",
  fillOpacity: 0.2,
};

// Carte en lecture seule affichant l'emprise des parcelles d'un site partenaire.
// Réutilise l'infra Leaflet existante (fonds IGN, limites cadastrales, sélecteur de couches).
export const SiteMap: React.FC<SiteMapProps> = ({ geometrie, centre, height = "260px" }) => {
  // Id de conteneur stable et unique (Leaflet cible un id DOM)
  const reactId = useId();
  const containerId = useMemo(() => `site-map-${reactId.replace(/:/g, "")}`, [reactId]);

  // Fond de carte local, par défaut "tous" (indépendant du choix de la carte de l'analyseur)
  const [activeLayer, setActiveLayer] = useState<MapLayerType>("tous");

  const initialCenter = useMemo<[number, number] | undefined>(
    () => (centre ? [centre.latitude, centre.longitude] : undefined),
    [centre],
  );

  // Lecture seule : pas de callback de clic
  const { mapRef, changeBaseLayer } = useLeafletMap({
    containerId,
    initialCenter,
    initialZoom: 17,
    baseLayer: activeLayer,
  });

  // Synchronise le fond de carte avec le sélecteur
  useEffect(() => {
    changeBaseLayer(activeLayer);
  }, [activeLayer, changeBaseLayer]);

  // Couche GeoJSON du site, conservée pour pouvoir recadrer à la demande
  const geoLayerRef = useRef<L.GeoJSON | null>(null);

  const recadrer = useCallback(() => {
    const map = mapRef.current;
    const layer = geoLayerRef.current;
    if (!map || !layer) return;
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 18 });
    }
  }, [mapRef]);

  // Rend l'emprise du site et cadre la vue dessus
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const layer = L.geoJSON(geometrie as GeoJsonObject, { style: () => SITE_STYLE });
    layer.addTo(map);
    geoLayerRef.current = layer;

    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 18 });
    }

    return () => {
      layer.remove();
      geoLayerRef.current = null;
    };
  }, [geometrie, mapRef]);

  return (
    <div className="mf-ms-map">
      <div className="mf-ms-map__toolbar">
        <MapLayerSelector activeLayer={activeLayer} onLayerChange={setActiveLayer} />
        <button
          type="button"
          className="fr-btn fr-btn--secondary fr-btn--sm fr-icon-zoom-in-line fr-btn--icon-left"
          onClick={recadrer}
          title="Recadrer sur le site"
        >
          Recadrer
        </button>
      </div>
      {/* Leaflet impose une hauteur explicite sur le conteneur */}
      <div id={containerId} className="fr-mt-4v" style={{ height, width: "100%" }} />
    </div>
  );
};
