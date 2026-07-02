import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoJsonObject } from "geojson";
import type { FricheCarte } from "@mutafriches/shared-types";
import { getGeoportalWMTSUrl, MAP_LAYERS } from "@shared/config/map-layers.config";

interface CartofrichesFrichesMapProps {
  friches: FricheCarte[];
  onSelectFriche: (friche: FricheCarte) => void;
  /** refcad (clé) de la friche survolée dans la liste, pour highlight synchronisé */
  refcadSurvolee?: string | null;
  onHoverFriche?: (cle: string | null) => void;
  height?: string;
}

const MAP_ID = "cartofriches-friches-map";

// Styles DSFR (bleu France) — alignés sur useMapParcelleRenderer
const STYLE_NORMAL: L.PathOptions = {
  color: "#6a6af4",
  weight: 2,
  fillColor: "#6a6af4",
  fillOpacity: 0.25,
};
const STYLE_HIGHLIGHT: L.PathOptions = {
  color: "#000091",
  weight: 3,
  fillColor: "#6a6af4",
  fillOpacity: 0.55,
};

/** Clé stable d'une friche (jointure de ses références cadastrales) */
function cleFriche(friche: FricheCarte): string {
  return friche.refcad.join(",");
}

/**
 * Carte Leaflet dédiée affichant les emprises des friches Cartofriches d'une commune.
 * Les emprises sont cliquables (→ comparaison) et se surlignent au survol de la liste.
 */
export function CartofrichesFrichesMap({
  friches,
  onSelectFriche,
  refcadSurvolee,
  onHoverFriche,
  height = "480px",
}: CartofrichesFrichesMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<Map<string, L.GeoJSON>>(new Map());
  // Callbacks dans des refs pour éviter de recréer les couches à chaque render
  const onSelectRef = useRef(onSelectFriche);
  const onHoverRef = useRef(onHoverFriche);
  useEffect(() => {
    onSelectRef.current = onSelectFriche;
  }, [onSelectFriche]);
  useEffect(() => {
    onHoverRef.current = onHoverFriche;
  }, [onHoverFriche]);

  // Initialisation de la carte (une fois)
  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map(MAP_ID, { renderer: L.svg(), maxZoom: 20 }).setView([46.6, 2.5], 6);
    const plan = MAP_LAYERS.plan;
    L.tileLayer(getGeoportalWMTSUrl(plan.layerName, plan.format), {
      attribution: plan.attribution,
      maxZoom: plan.maxZoom,
    }).addTo(map);
    mapRef.current = map;
    // Corrige le rendu si le conteneur a été monté masqué (onglet)
    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Rendu des emprises à chaque changement de friches
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    layersRef.current.forEach((layer) => layer.remove());
    layersRef.current.clear();

    const bounds = L.latLngBounds([]);

    for (const friche of friches) {
      if (!friche.geometry) continue;
      const cle = cleFriche(friche);
      const layer = L.geoJSON(friche.geometry as unknown as GeoJsonObject, { style: STYLE_NORMAL });
      layer.on("click", () => onSelectRef.current(friche));
      layer.on("mouseover", () => {
        layer.setStyle(STYLE_HIGHLIGHT);
        onHoverRef.current?.(cle);
      });
      layer.on("mouseout", () => {
        layer.setStyle(STYLE_NORMAL);
        onHoverRef.current?.(null);
      });
      layer.bindTooltip(friche.nom ?? cle, { sticky: true });
      layer.addTo(map);
      layersRef.current.set(cle, layer);
      bounds.extend(layer.getBounds());
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 17 });
    }
  }, [friches]);

  // Highlight synchronisé depuis la liste
  useEffect(() => {
    layersRef.current.forEach((layer, cle) => {
      layer.setStyle(cle === refcadSurvolee ? STYLE_HIGHLIGHT : STYLE_NORMAL);
    });
  }, [refcadSurvolee]);

  return <div id={MAP_ID} style={{ height, width: "100%" }} />;
}
