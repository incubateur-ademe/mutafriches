/**
 * Types communs partagés
 */

import { SourceUtilisation } from "../evaluation";

/**
 * Coordonnées géographiques GPS
 */
export interface Coordonnees {
  latitude: number;
  longitude: number;
}

/**
 * Origine de l'utilisation de l'API
 */
export interface OrigineUtilisation {
  source: SourceUtilisation;
  integrateur?: string;
}

/**
 * Géométrie complète de la parcelle (GeoJSON)
 */
export interface GeometrieParcelle {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
}
