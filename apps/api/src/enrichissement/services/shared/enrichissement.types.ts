/**
 * Types communs pour tous les sous-domaines d'enrichissement
 */

/**
 * Résultat standard d'un enrichissement
 */
export interface EnrichmentResult {
  success: boolean;
  sourcesUtilisees: string[];
  sourcesEchouees: string[];
  champsManquants?: string[];
}

/**
 * Contexte d'enrichissement partagé
 */
export interface EnrichmentContext {
  identifiantParcelle: string;
  coordonnees?: {
    latitude: number;
    longitude: number;
  };
  codeInsee?: string;
  commune?: string;
}
