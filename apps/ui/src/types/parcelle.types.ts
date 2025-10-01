import type { Geometry } from "geojson";

/**
 * Feature GeoJSON retournée par l'API Carto IGN
 */
export interface ApiCartoFeature {
  type: "Feature";
  id?: string;
  geometry: Geometry;
  properties: ParcelleProperties;
}

/**
 * FeatureCollection retournée par l'API Carto IGN
 */
export interface ApiCartoFeatureCollection {
  type: "FeatureCollection";
  features: ApiCartoFeature[];
  totalFeatures?: number;
  numberMatched?: number;
  numberReturned?: number;
}

/**
 * Propriétés d'une parcelle cadastrale
 */
export interface ParcelleProperties {
  idu?: string;
  id?: string;
  code_dep?: string;
  code_com?: string;
  code_insee?: string;
  commune?: string;
  nom_com?: string;
  section?: string;
  numero?: string;
  contenance?: number;
  [key: string]: unknown;
}

/**
 * Données de parcelle simplifiées pour l'affichage
 */
export interface ParcelleDisplayData {
  idu: string;
  commune: string;
  codeInsee: string;
  section: string;
  numero: string;
  surface: string;
}

/**
 * Callback appelé lors de la sélection d'une parcelle
 */
export type OnParcelleSelectedCallback = (idu: string, data: ParcelleDisplayData) => void;
