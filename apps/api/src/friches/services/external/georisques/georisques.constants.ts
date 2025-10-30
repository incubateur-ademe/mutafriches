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
  TRI: "/gaspar/tri",
  MVT: "/mvt",
  ZONAGE_SISMIQUE: "/zonage_sismique",
  CAVITES: "/cavites",
  OLD: "/old",
  SIS: "/ssp/conclusions_sis",
  ICPE: "/installations_classees",
  AZI: "/gaspar/azi",
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
  OLD: 0, // OLD ne nécessite pas de rayon (recherche par point)
  SIS: 1000, // 1 km pour SIS (max 10000m autorisé par l'API)
  ICPE: 1000, // 1 km pour ICPE (max 10000m autorisé par l'API)
  AZI: 1000, // 1 km pour AZI
} as const;

/**
 * Nombre d'éléments récents à retourner par API
 */
export const GEORISQUES_NOMBRE_RESULTATS_RECENTS = {
  CATNAT: 5, // 5 dernières catastrophes
  MVT: 5, // 5 mouvements les plus proches
  CAVITES: 5, // 5 cavités les plus proches
  SIS: 5, // 5 SIS les plus proches
  ICPE: 5, // 5 ICPE les plus proches
} as const;

/**
 * Sources de données GeoRisques
 */
export const GEORISQUES_SOURCES = {
  AZI: "GeoRisques - AZI",
  RGA: "GeoRisques - Retrait-Gonflement Argiles",
  CATNAT: "GeoRisques - Catastrophes Naturelles",
  TRI: "GeoRisques - TRI",
  TRI_ZONAGE: "GeoRisques - TRI Zonage Inondation",
  MVT: "GeoRisques - Mouvements de Terrain",
  ZONAGE_SISMIQUE: "GeoRisques - Zonage Sismique",
  CAVITES: "GeoRisques - Cavités Souterraines",
  OLD: "GeoRisques - Obligations Légales Débroussaillement",
  SIS: "GeoRisques - Secteurs d'Information sur les Sols",
  ICPE: "GeoRisques - Installations Classées",
} as const;

/**
 * Timeout par défaut pour les appels API (ms)
 */
export const GEORISQUES_TIMEOUT_MS = 5000;
