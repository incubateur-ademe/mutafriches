import { useCallback, useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { extractIdu, normalizeParcelId } from "../utils/geo.utils";
import { searchParcelWithFallback } from "../services/cadastre/api.cadastre.service";
import { OnParcelleSelectedCallback } from "../types/callbacks.types";
import { padParcelleSection } from "@mutafriches/shared-types";

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
  onAnalyze?: (identifiant: string) => void;
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
  onAnalyze,
}: UseLeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
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
              style="
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                padding: 8px 16px;
                font-size: 14px;
                font-weight: 500;
                color: #fff;
                background-color: #000091;
                border: none;
                cursor: pointer;
              "
              onmouseover="this.style.backgroundColor='#1212FF'"
              onmouseout="this.style.backgroundColor='#000091'"
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

        // Ajouter l'event listener sur le bouton apres ouverture du popup
        // Utiliser setTimeout pour s'assurer que le DOM est rendu
        setTimeout(() => {
          const btn = document.getElementById("analyze-parcel-btn");
          if (btn) {
            btn.onclick = () => {
              const parcelId = btn.getAttribute("data-parcel-id");
              if (parcelId && analyzeCallbackRef.current) {
                analyzeCallbackRef.current(parcelId);
                map.closePopup();
              }
            };
          }
        }, 0);
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
