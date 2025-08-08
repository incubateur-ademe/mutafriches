/**
 * Interfaces pour l'API Enedis Open Data
 * Documentation : https://data.enedis.fr/explore/dataset/poste-electrique/
 */

export interface EnedisApiResponse<T> {
  total_count: number;
  results: T[];
}

export interface EnedisGeoPoint {
  lon: number;
  lat: number;
}

export interface EnedisGeoShape {
  type: 'Feature';
  geometry: {
    coordinates: [number, number];
    type: 'Point';
  };
  properties: Record<string, unknown>;
}

export interface EnedisPosteElectriqueRecord {
  code_commune: string;
  nom_commune: string;
  code_epci: string;
  nom_epci: string;
  code_departement: string;
  nom_departement: string;
  code_region: string;
  nom_region: string;
  geo_shape: EnedisGeoShape;
  geo_point_2d: EnedisGeoPoint;
  x: number; // Coordonnée X en RGF93
  y: number; // Coordonnée Y en RGF93
}

export interface EnedisLigneBTRecord {
  code_commune?: string;
  nom_commune?: string;
  code_departement?: string;
  nom_departement?: string;
  geo_shape?: EnedisGeoShape;
  geo_point_2d?: EnedisGeoPoint;
  tension?: string;
  nature?: string;
  longueur?: number;
}

export interface EnedisPoteauRecord {
  code_commune?: string;
  nom_commune?: string;
  code_departement?: string;
  nom_departement?: string;
  geo_shape?: EnedisGeoShape;
  geo_point_2d?: EnedisGeoPoint;
  tension?: string; // 'BT' ou 'HTA'
  type_poteau?: string;
}

export type EnedisDatasetRecord =
  | EnedisPosteElectriqueRecord
  | EnedisLigneBTRecord
  | EnedisPoteauRecord;

export interface EnedisApiParams {
  dataset:
    | 'poste-electrique'
    | 'reseau-bt'
    | 'reseau-souterrain-bt'
    | 'position-geographique-des-poteaux-hta-et-bt';
  rows?: number; // limite de résultats (défaut: 10)
  start?: number; // offset
  select?: string; // champs à sélectionner
  where?: string; // clause WHERE
  order_by?: string; // tri
  group_by?: string; // groupement
  'geofilter.distance'?: string; // "lat,lon,distance_in_meters"
  'geofilter.polygon'?: string; // WKT polygon
  'geofilter.bbox'?: string; // "lat1,lon1,lat2,lon2"
  refine?: Record<string, string>; // filtres par facette
  exclude?: Record<string, string>; // exclusions par facette
  lang?: 'fr' | 'en';
  timezone?: string;
}

export interface EnedisEndpointConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

export interface EnedisApiError {
  code: string;
  message: string;
  details?: unknown;
}
