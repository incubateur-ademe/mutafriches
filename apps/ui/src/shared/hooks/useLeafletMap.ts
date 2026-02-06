import { useCallback, useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { extractIdu, normalizeParcelId } from "../utils/geo.utils";
import { searchParcelWithFallback } from "../services/cadastre/api.cadastre.service";
import { OnParcelleSelectedCallback } from "../types/callbacks.types";
import { padParcelleSection } from "@mutafriches/shared-types";
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

interface UseLeafletMapProps {
  containerId: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  onParcelleSelected?: OnParcelleSelectedCallback;
  onAnalyze?: (identifiant: string) => void;
  baseLayer?: MapLayerType;
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
  // Retirer toutes les couches existantes
  layersRef.forEach((tileLayer) => {
    map.removeLayer(tileLayer);
  });
  layersRef.clear();

  if (layer === "tous") {
    // Mode superposition : afficher les 3 couches
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
    // Mode normal : une seule couche active
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
 * Hook personnalisé pour gérer une carte Leaflet avec sélection de parcelles cadastrales.
 * Utilise l'API Carto IGN pour récupérer les données des parcelles au clic.
 */
export function useLeafletMap({
  containerId,
  initialCenter = [48.8589, 2.3469], // Centre par défaut (Paris)
  initialZoom = 17,
  onParcelleSelected,
  onAnalyze,
  baseLayer = "plan",
}: UseLeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<Map<TileLayerType, L.TileLayer>>(new Map());
  const highlightRef = useRef<L.GeoJSON | null>(null);
  const callbackRef = useRef<OnParcelleSelectedCallback | undefined>(onParcelleSelected);
  const analyzeCallbackRef = useRef<((identifiant: string) => void) | undefined>(onAnalyze);

  // Fonction exposée pour recentrer la carte
  const flyToLocation = useCallback((lat: number, lng: number, zoom = 17) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], zoom, {
        duration: 1.5,
      });
    }
  }, []);

  // Fonction exposée pour changer le fond de carte dynamiquement
  const changeBaseLayer = useCallback((newLayer: MapLayerType) => {
    if (!mapRef.current) return;
    applyLayers(mapRef.current, layersRef.current, newLayer);
  }, []);

  // Synchroniser les refs des callbacks
  useEffect(() => {
    callbackRef.current = onParcelleSelected;
  }, [onParcelleSelected]);

  useEffect(() => {
    analyzeCallbackRef.current = onAnalyze;
  }, [onAnalyze]);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Conteneur #${containerId} introuvable`);
      return;
    }

    // Initialisation de la carte Leaflet
    const map = L.map(containerId, {
      preferCanvas: false,
      renderer: L.svg(),
    }).setView(initialCenter, initialZoom);

    // Initialiser les fonds de carte selon le mode
    applyLayers(map, layersRef.current, baseLayer);

    // Couche WMS Parcellaire Express (visualisation des limites cadastrales)
    const parcelLayer = L.tileLayer.wms("https://data.geopf.fr/wms-v/ows", {
      layers: "CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle",
      format: "image/png",
      transparent: true,
      version: "1.3.0",
      attribution: "© IGN - Parcellaire Express",
      opacity: 0.7,
    });
    parcelLayer.addTo(map);

    // LayerGroup pour gérer les parcelles sélectionnées
    const parcelLayerGroup = L.layerGroup().addTo(map);

    // Event delegation pour le bouton "Analyser"
    // Permet d'éviter les race conditions avec le setTimeout et autoClose de Leaflet
    const handleAnalyzeClick = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.id === "analyze-parcel-btn") {
        event.preventDefault();
        event.stopPropagation();

        const parcelId = target.getAttribute("data-parcel-id");
        if (parcelId && analyzeCallbackRef.current) {
          analyzeCallbackRef.current(parcelId);
          map.closePopup();
        }
      }
    };

    // Attacher le listener une seule fois sur le conteneur de la carte
    // Utiliser la phase de capture (true) pour intercepter avant Leaflet
    const mapContainer = map.getContainer();
    mapContainer.addEventListener("click", handleAnalyzeClick, true);

    // Gestionnaire de clic : recherche et affichage de la parcelle
    map.on("click", async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      // Nettoyer la sélection précédente
      if (highlightRef.current) {
        parcelLayerGroup.clearLayers();
        highlightRef.current = null;
      }

      try {
        const result = await searchParcelWithFallback(lng, lat);

        if (!result || !result.features || result.features.length === 0) {
          return;
        }

        const feature = result.features[0];
        const p = feature.properties;

        // Extraire l'IDU brut depuis l'API Carto
        let idu = extractIdu(p);

        // ÉTAPE 1 : Padder la section à 2 caractères si nécessaire
        // (L'API Carto retourne parfois des sections à 1 caractère)
        idu = padParcelleSection(idu);

        // ÉTAPE 2 : Normaliser l'IDU (retire les zéros préfixes des sections)
        idu = normalizeParcelId(idu);

        // Appel du callback avec les données de la parcelle normalisées
        if (callbackRef.current) {
          callbackRef.current(idu);
        }

        // Affichage du liseré bleu autour de la parcelle
        if (feature.geometry) {
          const layer = L.geoJSON(feature.geometry, {
            style: {
              color: "#3388ff",
              weight: 3,
              fillColor: "#3388ff",
              fillOpacity: 0.2,
            },
          });

          parcelLayerGroup.addLayer(layer);
          highlightRef.current = layer;

          // Zoom intelligent : recentre uniquement si la parcelle n'est pas visible
          const bounds = layer.getBounds();
          if (!map.getBounds().contains(bounds)) {
            map.fitBounds(bounds, { padding: [20, 20] });
          }
        }

        // Popup avec les informations de la parcelle et bouton d'analyse
        const popupContent = `
          <div style="min-width: 220px">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">Parcelle Cadastrale</h3>
            <table style="width: 100%; font-size: 13px; margin-bottom: 12px;">
              <tr><td style="padding: 2px 0;"><b>IDU:</b></td><td style="padding: 2px 0;">${idu}</td></tr>
              <tr><td style="padding: 2px 0;"><b>Commune:</b></td><td style="padding: 2px 0;">${p.nom_com || p.commune || "-"}</td></tr>
              <tr><td style="padding: 2px 0;"><b>Surface:</b></td><td style="padding: 2px 0;">${p.contenance ? `${p.contenance} m\u00B2` : "-"}</td></tr>
            </table>
            <button
              id="analyze-parcel-btn"
              data-parcel-id="${idu}"
              class="fr-btn fr-btn--lg"
            >
              Analyser cette parcelle
            </button>
          </div>
        `;

        L.popup({
          closeButton: true,
          autoClose: true,
        })
          .setLatLng(e.latlng)
          .setContent(popupContent)
          .openOn(map);

        // L'event listener est géré par delegation (voir handleAnalyzeClick ci-dessus)
        // Plus besoin de setTimeout ni d'attacher manuellement le onclick
      } catch (err) {
        console.error("Erreur lors de la recherche de parcelle:", err);
      }
    });

    mapRef.current = map;

    // Nettoyage à la destruction du composant
    return () => {
      // Retirer le listener d'event delegation
      mapContainer.removeEventListener("click", handleAnalyzeClick, true);

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [containerId, initialCenter, initialZoom, baseLayer]);

  // Memoization des fonctions exposées pour éviter les rerenders inutiles
  return useMemo(() => ({ flyToLocation, changeBaseLayer }), [flyToLocation, changeBaseLayer]);
}
