/**
 * Constantes pour l'API Enedis Open Data
 */

/**
 * URL de base de l'API Enedis (Data-Fair)
 */
export const ENEDIS_API_BASE_URL = "https://opendata.enedis.fr/data-fair/api/v1/datasets";

/**
 * Rayons de recherche par défaut (en mètres)
 */
export const ENEDIS_RAYONS = {
  POSTES: 5000, // 5 km pour les postes électriques
  LIGNES_BT: 500, // 500 m pour les lignes basse tension
} as const;

/**
 * Seuils de distance pour la logique métier (en mètres)
 */
export const ENEDIS_SEUILS = {
  RACCORDEMENT_BT: 100, // Distance max pour raccordement BT direct (en mètres)
  TYPE_BT_VS_HTA: 200, // Seuil pour déterminer BT vs HTA (en mètres)
  CAPACITE_DISPONIBLE: 1000, // Seuil pour estimer la capacité disponible (en mètres)
  DISTANCE_DEFAUT: 999000, // Distance par défaut si aucune infrastructure trouvée (en mètres)
} as const;

/**
 * Nombre de résultats par requête
 */
export const ENEDIS_NOMBRE_RESULTATS = {
  POSTES: 50,
  LIGNES_BT: 100,
} as const;

/**
 * Source de données
 */
export const ENEDIS_SOURCE = "enedis-api";

/**
 * Timeout par défaut pour les appels API (ms)
 */
export const ENEDIS_TIMEOUT_MS = 10000;
