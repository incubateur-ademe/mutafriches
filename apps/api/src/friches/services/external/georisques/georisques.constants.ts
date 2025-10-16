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

  TRI: "/gaspar/tri",
  ZONAGE_SISMIQUE: "/zonage_sismique",
  SSP: "/ssp",
  ICPE: "/installations_classees",
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

  TRI: 5000, // 5 km pour inondations
  SSP: 500, // 500m pour pollution
  ICPE: 2000, // 2 km pour installations classées
  CAVITES: 1000, // 1 km pour cavités
} as const;

/**
 * Nombre d'éléments récents à retourner par API
 */
export const GEORISQUES_NOMBRE_RESULTATS_RECENTS = {
  CATNAT: 5, // 5 dernières catastrophes
  MVT: 5, // 5 mouvements les plus proches
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
  SSP: "GeoRisques - Sites et Sols Pollués",
  ICPE: "GeoRisques - Installations Classées",
} as const;

/**
 * Timeout par défaut pour les appels API (ms)
 */
export const GEORISQUES_TIMEOUT_MS = 5000;
