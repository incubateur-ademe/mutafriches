import { useCallback, useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { searchParcelWithFallback } from "../services/cadastre/cadastre.service";
import { extractIdu } from "../services/cadastre/geo.utils";
import type { ParcelleDisplayData, OnParcelleSelectedCallback } from "../types/parcelle.types";

// Fix Leaflet : Réinitialisation des icônes par défaut
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
}

/**
 * Hook personnalisé pour gérer une carte Leaflet avec sélection de parcelles cadastrales.
 * Utilise l'API Carto IGN pour récupérer les données des parcelles au clic.
 */
export function useLeafletMap({
  containerId,
  initialCenter = [48.8589, 2.3469],
  initialZoom = 17,
  onParcelleSelected,
}: UseLeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const highlightRef = useRef<L.GeoJSON | null>(null);
  const callbackRef = useRef<OnParcelleSelectedCallback | undefined>(onParcelleSelected);

  // Fonction exposée pour recentrer la carte
  const flyToLocation = useCallback((lat: number, lng: number, zoom = 17) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], zoom, {
        duration: 1.5,
      });
    }
  }, []);

  // Synchroniser la ref du callback
  useEffect(() => {
    callbackRef.current = onParcelleSelected;
  }, [onParcelleSelected]);

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

    // Tuiles IGN Plan v2 (haute résolution)
    function getGeoportalWMTSUrl(layerName: string): string {
      let url = "https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile";
      url += "&LAYER=" + layerName;
      url += "&STYLE=normal&FORMAT=image/png";
      url += "&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}";
      return url;
    }

    L.tileLayer(getGeoportalWMTSUrl("GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2"), {
      attribution: '© <a href="https://www.ign.fr/">IGN</a>',
      maxZoom: 19,
    }).addTo(map);

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
        const idu = extractIdu(p);

        const data: ParcelleDisplayData = {
          idu,
          commune: p.nom_com || p.commune || "-",
          codeInsee: p.code_com || p.code_insee || "-",
          section: p.section || "-",
          numero: p.numero || "-",
          surface: p.contenance ? `${p.contenance} m²` : "-",
        };

        // Appel du callback avec les données de la parcelle
        if (callbackRef.current) {
          callbackRef.current(idu, data);
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

        // Popup avec les informations de la parcelle
        const popupContent = `
          <div style="min-width: 200px">
            <h3 style="margin: 0 0 10px 0;">Parcelle Cadastrale</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr><td><b>IDU:</b></td><td>${data.idu}</td></tr>
              <tr><td><b>Commune:</b></td><td>${data.commune}</td></tr>
              <tr><td><b>Code INSEE:</b></td><td>${data.codeInsee}</td></tr>
              <tr><td><b>Section:</b></td><td>${data.section}</td></tr>
              <tr><td><b>Numéro:</b></td><td>${data.numero}</td></tr>
              <tr><td><b>Surface:</b></td><td>${data.surface}</td></tr>
            </table>
          </div>
        `;

        L.popup({
          closeButton: true,
          autoClose: true,
        })
          .setLatLng(e.latlng)
          .setContent(popupContent)
          .openOn(map);
      } catch (err) {
        console.error("Erreur lors de la recherche de parcelle:", err);
      }
    });

    mapRef.current = map;

    // Nettoyage à la destruction du composant
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [containerId, initialCenter, initialZoom]);

  // Memoization de la fonction flyToLocation pour éviter les rerenders inutiles
  return useMemo(() => ({ flyToLocation }), [flyToLocation]);
}
