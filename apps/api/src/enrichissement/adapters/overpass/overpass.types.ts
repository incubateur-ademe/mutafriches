import { ApiResponse } from "../shared/api-response.types";

/**
 * Élément OSM retourné par l'API Overpass
 */
export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
}

/**
 * Réponse brute de l'API Overpass
 */
export interface OverpassRawResponse {
  version: number;
  generator: string;
  osm3s: {
    timestamp_osm_base: string;
    copyright: string;
  };
  elements: OverpassElement[];
}

/**
 * POI (Point of Interest) normalisé
 */
export interface OverpassPoi {
  id: number;
  type: "node" | "way" | "relation";
  latitude: number;
  longitude: number;
  distanceMetres: number;
  name?: string;
  category: string;
  subcategory?: string;
}

/**
 * Résultat de recherche de transports en commun
 */
export interface OverpassTransportResult {
  /** Distance en mètres au transport le plus proche */
  distanceMetres: number;
  /** Type de transport le plus proche */
  typeTransport: string;
  /** Nom de l'arrêt/gare le plus proche */
  nomArret?: string;
  /** Nombre total de transports dans le rayon */
  nombreTransports: number;
  /** Liste des transports trouvés (optionnel, pour debug) */
  transports?: OverpassPoi[];
}

/**
 * Résultat de recherche de commerces/services
 */
export interface OverpassCommercesResult {
  /** Présence de commerces/services dans le rayon */
  presenceCommercesServices: boolean;
  /** Nombre total de commerces/services trouvés */
  nombreCommercesServices: number;
  /** Distance au commerce/service le plus proche (en mètres) */
  distancePlusProche?: number;
  /** Catégories de commerces trouvés */
  categoriesTrouvees?: string[];
}

/**
 * Configuration pour une requête Overpass
 */
export interface OverpassQueryConfig {
  latitude: number;
  longitude: number;
  rayonMetres: number;
  timeout?: number;
}

/**
 * Interface du service Overpass
 */
export interface IOverpassService {
  /**
   * Recherche le transport en commun le plus proche
   */
  getDistanceTransportCommun(
    latitude: number,
    longitude: number,
    rayonMetres: number,
  ): Promise<ApiResponse<OverpassTransportResult>>;

  /**
   * Vérifie la présence de commerces/services à proximité
   */
  hasCommercesServices(
    latitude: number,
    longitude: number,
    rayonMetres: number,
  ): Promise<ApiResponse<OverpassCommercesResult>>;
}
