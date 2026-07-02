import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoJsonObject } from "geojson";
import type { FricheCarte } from "@mutafriches/shared-types";
import { getGeoportalWMTSUrl, MAP_LAYERS } from "@shared/config/map-layers.config";
import { fricheMarkerIcon } from "./fricheMarkerIcon";

interface CartofrichesFrichesMapProps {
  friches: FricheCarte[];
  onSelectFriche: (friche: FricheCarte) => void;
  /** refcad (clé) de la friche survolée dans la liste, pour highlight synchronisé */
  refcadSurvolee?: string | null;
  onHoverFriche?: (cle: string | null) => void;
  height?: string;
}

const MAP_ID = "cartofriches-friches-map";

// Emprise affichée au survol d'une friche (bleu France)
const STYLE_EMPRISE: L.PathOptions = {
  color: "#000091",
  weight: 2,
  fillColor: "#6a6af4",
  fillOpacity: 0.3,
};

/** Clé stable d'une friche (jointure de ses références cadastrales) */
function cleFriche(friche: FricheCarte): string {
  return friche.refcad.join(",");
}

/**
 * Carte Leaflet dédiée affichant les friches Cartofriches d'une commune sous forme de
 * marqueurs colorés par statut (façon Cartofriches). L'emprise s'affiche au survol.
 */
export function CartofrichesFrichesMap({
  friches,
  onSelectFriche,
  refcadSurvolee,
  onHoverFriche,
  height = "640px",
}: CartofrichesFrichesMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: L.Marker; friche: FricheCarte }>>(new Map());
  const hoverLayerRef = useRef<L.GeoJSON | null>(null);
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
    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Rendu des marqueurs à chaque changement de friches
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current.clear();
    if (hoverLayerRef.current) {
      hoverLayerRef.current.remove();
      hoverLayerRef.current = null;
    }

    const bounds = L.latLngBounds([]);

    for (const friche of friches) {
      if (!friche.geometry) continue;
      const cle = cleFriche(friche);
      const centre = L.geoJSON(friche.geometry as unknown as GeoJsonObject)
        .getBounds()
        .getCenter();
      const marker = L.marker(centre, { icon: fricheMarkerIcon(friche.statut, false) });
      marker.bindTooltip(friche.nom ?? cle);
      marker.on("click", () => onSelectRef.current(friche));
      marker.on("mouseover", () => onHoverRef.current?.(cle));
      marker.on("mouseout", () => onHoverRef.current?.(null));
      marker.addTo(map);
      markersRef.current.set(cle, { marker, friche });
      bounds.extend(centre);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
    }
  }, [friches]);

  // Highlight synchronisé (survol depuis la liste ou la carte) : marqueur agrandi + emprise
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (hoverLayerRef.current) {
      hoverLayerRef.current.remove();
      hoverLayerRef.current = null;
    }

    markersRef.current.forEach(({ marker, friche }, cle) => {
      const actif = cle === refcadSurvolee;
      marker.setIcon(fricheMarkerIcon(friche.statut, actif));
      if (actif && friche.geometry) {
        hoverLayerRef.current = L.geoJSON(friche.geometry as unknown as GeoJsonObject, {
          style: STYLE_EMPRISE,
        }).addTo(map);
      }
    });
  }, [refcadSurvolee]);

  return <div id={MAP_ID} style={{ height, width: "100%" }} />;
}
