import { intersect } from "@turf/intersect";
import { area } from "@turf/area";
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from "geojson";
import { ParcelleGeometry } from "./geometry.types";
import { ApiCartoGpuFeature } from "../../adapters/api-carto/gpu/api-carto-gpu.types";

/**
 * Résultat de la sélection de la feature dominante
 */
export interface FeatureDominanteResult {
  /** Feature sélectionnée (celle avec la plus grande surface d'intersection) */
  feature: ApiCartoGpuFeature;
  /** Index de la feature sélectionnée dans le tableau d'origine */
  index: number;
  /** Surface d'intersection en m² (null si non calculable) */
  surfaceIntersection: number | null;
  /** Nombre total de features candidates */
  nombreFeatures: number;
}

/**
 * Sélectionne la feature dont la géométrie recouvre la plus grande surface
 * de la parcelle, via calcul d'intersection Turf.js.
 *
 * Cas particuliers :
 * - 1 seule feature → retour immédiat
 * - Géométrie de type Point → retour de la première feature (pas d'intersection possible)
 * - Erreur de calcul sur une feature → celle-ci est ignorée (surface = 0)
 *
 * @param parcelleGeometry - Géométrie GeoJSON de la parcelle
 * @param features - Tableau de features renvoyées par l'API Carto GPU
 * @returns La feature dominante avec ses métadonnées
 */
export function selectionnerFeatureDominante(
  parcelleGeometry: ParcelleGeometry,
  features: ApiCartoGpuFeature[],
): FeatureDominanteResult {
  // Cas trivial : une seule feature
  if (features.length === 1) {
    return {
      feature: features[0],
      index: 0,
      surfaceIntersection: null,
      nombreFeatures: 1,
    };
  }

  // Géométrie Point : pas d'intersection possible, retour de la première
  if (parcelleGeometry.type === "Point") {
    return {
      feature: features[0],
      index: 0,
      surfaceIntersection: null,
      nombreFeatures: features.length,
    };
  }

  const parcelleFeature = toTurfFeature(parcelleGeometry);

  let meilleurIndex = 0;
  let meilleureArea = 0;

  for (let i = 0; i < features.length; i++) {
    const surfaceIntersection = calculerSurfaceIntersection(parcelleFeature, features[i]);

    if (surfaceIntersection > meilleureArea) {
      meilleureArea = surfaceIntersection;
      meilleurIndex = i;
    }
  }

  return {
    feature: features[meilleurIndex],
    index: meilleurIndex,
    surfaceIntersection: meilleureArea > 0 ? Math.round(meilleureArea) : null,
    nombreFeatures: features.length,
  };
}

/**
 * Calcule la surface d'intersection entre la parcelle et une feature de zone
 *
 * @param parcelleFeature - Feature GeoJSON de la parcelle
 * @param zoneFeature - Feature renvoyée par l'API Carto GPU
 * @returns Surface d'intersection en m² (0 si erreur ou pas d'intersection)
 */
function calculerSurfaceIntersection(
  parcelleFeature: Feature<Polygon | MultiPolygon>,
  zoneFeature: ApiCartoGpuFeature,
): number {
  try {
    const zoneGeoJson: Feature<Polygon | MultiPolygon> = {
      type: "Feature",
      geometry: zoneFeature.geometry as unknown as Polygon | MultiPolygon,
      properties: {},
    };

    const featureCollection: FeatureCollection<Polygon | MultiPolygon> = {
      type: "FeatureCollection",
      features: [parcelleFeature, zoneGeoJson],
    };

    const inter = intersect(featureCollection);

    if (!inter) {
      return 0;
    }

    return area(inter);
  } catch {
    return 0;
  }
}

/**
 * Convertit une ParcelleGeometry en Feature GeoJSON compatible Turf.js
 */
function toTurfFeature(geometry: ParcelleGeometry): Feature<Polygon | MultiPolygon> {
  return {
    type: "Feature",
    geometry: geometry as unknown as Polygon | MultiPolygon,
    properties: {},
  };
}
