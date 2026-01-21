/**
 * Types pour l'API Enedis Open Data (Data-Fair)
 * Documentation : https://opendata.enedis.fr/datasets/poste-electrique/api-doc
 */

/**
 * Réponse générique de l'API Enedis
 */
export interface EnedisApiResponse<T> {
  total: number;
  results: T[];
  next?: string;
}

/**
 * Géométrie GeoJSON retournée par l'API
 */
export interface EnedisGeometry {
  type: "Point" | "LineString";
  coordinates: [number, number] | Array<[number, number]>; // [lon, lat]
}

/**
 * Enregistrement d'un poste électrique (dataset: poste-electrique)
 */
export interface EnedisPosteElectriqueRecord {
  _id: string;
  _geo_distance?: number;
  _geopoint?: string;
  code_commune: string;
  nom_commune: string;
  code_epci?: string;
  nom_epci?: string;
  code_departement: string;
  nom_departement: string;
  code_region: string;
  nom_region: string;
  code_iris?: string;
  nom_iris?: string;
  geometry: EnedisGeometry;
  x?: number;
  y?: number;
}

/**
 * Enregistrement d'une ligne BT (dataset: reseau-bt)
 */
export interface EnedisLigneBTRecord {
  _id: string;
  _geo_distance?: number;
  _geopoint?: string;
  code_commune?: string;
  nom_commune?: string;
  code_departement?: string;
  nom_departement?: string;
  code_region?: string;
  nom_region?: string;
  code_iris?: string;
  nom_iris?: string;
  geometry?: EnedisGeometry;
}

/**
 * Union des types de records
 */
export type EnedisDatasetRecord = EnedisPosteElectriqueRecord | EnedisLigneBTRecord;

/**
 * Paramètres de requête API
 */
export interface EnedisApiParams {
  dataset: "poste-electrique" | "reseau-bt" | "reseau-souterrain-bt";
  size?: number;
  geo_distance?: string; // "lon,lat,distance_in_meters"
  select?: string;
  q?: string;
}

/**
 * Erreur API
 */
export interface EnedisApiError {
  code: string;
  message: string;
  details?: unknown;
}
