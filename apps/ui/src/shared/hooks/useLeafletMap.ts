import { useCallback, useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { extractIdu, normalizeParcelId } from "../utils/geo.utils";
import { searchParcelWithFallback } from "../services/cadastre/api.cadastre.service";
import { padParcelleSection } from "@mutafriches/shared-types";
import type { Geometry } from "geojson";
import type { ParcelleProperties } from "../services/cadastre/api.cadastre.types";
import {
  MapLayerType,
  TileLayerType,
  MAP_LAYERS,
  TILE_LAYERS,
  getGeoportalWMTSUrl,
} from "../config/map-layers.config";

// @ts-expect-error - Suppression nécessaire pour le fix Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

/**
 * Callback appelé lors du clic sur une parcelle de la carte.
 * Fournit l'IDU normalisé, la géométrie, les propriétés et la contenance.
 */
export type OnMapParcelleClickCallback = (
  idu: string,
  geometry: Geometry,
  properties: ParcelleProperties,
  contenance: number,
) => void;

/**
 * Callback appelé lors d'un clic dans le vide (pas sur une parcelle).
 */
export type OnMapEmptyClickCallback = () => void;

interface UseLeafletMapProps {
  containerId: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  baseLayer?: MapLayerType;
  onParcelleClick?: OnMapParcelleClickCallback;
  onEmptyClick?: OnMapEmptyClickCallback;
}

/** Opacité par couche en mode superposition ("tous") */
const STACKED_OPACITY: Record<TileLayerType, number> = {
  orthophotos: 1,
  plan: 0.6,
  cadastre: 0.7,
};

/**
 * Ajoute les couches de tuiles sur la carte selon le mode sélectionné.
 * En mode "tous", empile les 3 couches avec des opacités différentes.
 */
function applyLayers(
  map: L.Map,
  layersRef: Map<TileLayerType, L.TileLayer>,
  layer: MapLayerType,
): void {
  layersRef.forEach((tileLayer) => {
    map.removeLayer(tileLayer);
  });
  layersRef.clear();

  if (layer === "tous") {
    TILE_LAYERS.forEach((layerType) => {
      const layerConfig = MAP_LAYERS[layerType];
      const tileLayer = L.tileLayer(
        getGeoportalWMTSUrl(layerConfig.layerName, layerConfig.format),
        {
          attribution: layerConfig.attribution,
          maxZoom: layerConfig.maxZoom,
          minZoom: layerConfig.minZoom,
          opacity: STACKED_OPACITY[layerType],
        },
      );
      tileLayer.addTo(map);
      layersRef.set(layerType, tileLayer);
    });
  } else {
    const layerConfig = MAP_LAYERS[layer];
    const tileLayer = L.tileLayer(
      getGeoportalWMTSUrl(layerConfig.layerName, layerConfig.format),
      {
        attribution: layerConfig.attribution,
        maxZoom: layerConfig.maxZoom,
        minZoom: layerConfig.minZoom,
      },
    );
    tileLayer.addTo(map);
    layersRef.set(layer, tileLayer);
  }
}

/**
 * Hook personnalisé pour gérer une carte Leaflet avec sélection multi-parcelle.
 *
 * Responsabilités :
 * - Initialisation de la carte et des fonds de carte
 * - Gestion du clic : appel API Carto puis callback onParcelleClick
 * - Clic dans le vide : callback onEmptyClick
 * - Expose la ref de la carte pour le rendu externe des parcelles
 */
export function useLeafletMap({
  containerId,
  initialCenter = [48.8589, 2.3469],
  initialZoom = 17,
  baseLayer = "plan",
  onParcelleClick,
  onEmptyClick,
}: UseLeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<Map<TileLayerType, L.TileLayer>>(new Map());
  const parcelleClickRef = useRef<OnMapParcelleClickCallback | undefined>(onParcelleClick);
  const emptyClickRef = useRef<OnMapEmptyClickCallback | undefined>(onEmptyClick);

  // Synchroniser les refs des callbacks
  useEffect(() => {
    parcelleClickRef.current = onParcelleClick;
  }, [onParcelleClick]);

  useEffect(() => {
    emptyClickRef.current = onEmptyClick;
  }, [onEmptyClick]);

  const flyToLocation = useCallback((lat: number, lng: number, zoom = 17) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], zoom, { duration: 1.5 });
    }
  }, []);

  const changeBaseLayer = useCallback((newLayer: MapLayerType) => {
    if (!mapRef.current) return;
    applyLayers(mapRef.current, layersRef.current, newLayer);
  }, []);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Conteneur #${containerId} introuvable`);
      return;
    }

    const map = L.map(containerId, {
      preferCanvas: false,
      renderer: L.svg(),
    }).setView(initialCenter, initialZoom);

    applyLayers(map, layersRef.current, baseLayer);

    // Couche WMS Parcellaire Express (limites cadastrales toujours visibles)
    const parcelLayer = L.tileLayer.wms("https://data.geopf.fr/wms-v/ows", {
      layers: "CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle",
      format: "image/png",
      transparent: true,
      version: "1.3.0",
      attribution: "© IGN - Parcellaire Express",
      opacity: 0.7,
    });
    parcelLayer.addTo(map);

    // Gestionnaire de clic : recherche de parcelle via API Carto
    map.on("click", async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      try {
        const result = await searchParcelWithFallback(lng, lat);

        if (!result || !result.features || result.features.length === 0) {
          // Clic dans le vide (pas de parcelle trouvée)
          if (emptyClickRef.current) {
            emptyClickRef.current();
          }
          return;
        }

        const feature = result.features[0];
        const p = feature.properties;

        // Normaliser l'identifiant cadastral
        let idu = extractIdu(p);
        idu = padParcelleSection(idu);
        idu = normalizeParcelId(idu);

        const contenance = p.contenance ?? 0;

        // Déléguer la logique de sélection au composant parent
        if (parcelleClickRef.current && feature.geometry) {
          parcelleClickRef.current(idu, feature.geometry, p, contenance);
        }
      } catch (err) {
        console.error("Erreur lors de la recherche de parcelle:", err);
      }
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [containerId, initialCenter, initialZoom, baseLayer]);

  return useMemo(
    () => ({ flyToLocation, changeBaseLayer, mapRef }),
    [flyToLocation, changeBaseLayer],
  );
}
