/**
 * Constantes du module Cartofriches (comparaison avec l'API Cerema).
 */

/** Base URL de l'API Données foncières du Cerema (accès libre, sans authentification) */
export const CARTOFRICHES_API_BASE_URL =
  process.env.CARTOFRICHES_API_URL ?? "https://apidf-preprod.cerema.fr";

/** Source affichée dans les ApiResponse */
export const CARTOFRICHES_SOURCE = "Cartofriches-Cerema";

/** Timeout des appels HTTP (l'API preprod peut être lente) */
export const CARTOFRICHES_TIMEOUT_MS = 15000;

/** Taille de page demandée à l'API (l'endpoint est paginé) */
export const CARTOFRICHES_PAGE_SIZE = 500;

/** Nombre maximal de pages parcourues (garde-fou anti-boucle) */
export const CARTOFRICHES_MAX_PAGES = 20;

/** Durée de vie du cache mémoire par code INSEE (ms) */
export const CARTOFRICHES_CACHE_TTL_MS = 10 * 60 * 1000;

/** Base de l'URL publique d'une fiche Cartofriches */
export const CARTOFRICHES_FICHE_URL_BASE = "https://cartofriches.cerema.fr/cartofriches/?site=";
