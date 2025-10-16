/**
 * Constantes pour l'API GeoRisques
 */

/**
 * URL de base de l'API GeoRisques
 */
export const GEORISQUES_API_BASE_URL = "https://www.georisques.gouv.fr/api/v1";

/**
 * Endpoints spécifiques
 */
export const GEORISQUES_ENDPOINTS = {
  RGA: "/rga",
  CATNAT: "/gaspar/catnat",
  TRI_ZONAGE: "/tri_zonage",
  MVT: "/mvt",
  ZONAGE_SISMIQUE: "/zonage_sismique",
  CAVITES: "/cavites",
} as const;

/**
 * Rayons de recherche par défaut (en mètres)
 */
export const GEORISQUES_RAYONS_DEFAUT = {
  RGA: 0, // RGA ne nécessite pas de rayon (recherche par point)
  CATNAT: 1000, // 1 km pour catastrophes naturelles
  TRI_ZONAGE: 0, // TRI ne nécessite pas de rayon (recherche par point)
  MVT: 1000, // 1 km pour mouvements de terrain
  ZONAGE_SISMIQUE: 0, // Zonage sismique ne nécessite pas de rayon (recherche par point)
  CAVITES: 1000, // 1 km pour cavités
} as const;

/**
 * Nombre d'éléments récents à retourner par API
 */
export const GEORISQUES_NOMBRE_RESULTATS_RECENTS = {
  CATNAT: 5, // 5 dernières catastrophes
  MVT: 5, // 5 mouvements les plus proches
  CAVITES: 5, // 5 cavités les plus proches
} as const;

/**
 * Sources de données GeoRisques
 */
export const GEORISQUES_SOURCES = {
  RGA: "GeoRisques - Retrait-Gonflement Argiles",
  CATNAT: "GeoRisques - Catastrophes Naturelles",
  TRI_ZONAGE: "GeoRisques - TRI Zonage Inondation",
  MVT: "GeoRisques - Mouvements de Terrain",
  ZONAGE_SISMIQUE: "GeoRisques - Zonage Sismique",
  CAVITES: "GeoRisques - Cavités Souterraines",
} as const;

/**
 * Timeout par défaut pour les appels API (ms)
 */
export const GEORISQUES_TIMEOUT_MS = 5000;
