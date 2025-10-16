/**
 * Types spécifiques pour l'API OLD (Obligations Légales de Débroussaillement)
 */

/**
 * Commune
 */
export interface OldCommune {
  code: string;
  nom: string;
}

/**
 * Coordonnées
 */
export interface OldCoordonnees {
  latitude: number;
  longitude: number;
}

/**
 * Risque OLD
 */
export interface OldRisque {
  url: string;
  "Date approbation": string; // Format ISO
}

/**
 * Item OLD
 */
export interface OldItem {
  commune: OldCommune;
  coordonnees: OldCoordonnees;
  risque: OldRisque;
}

/**
 * Réponse brute de l'API GeoRisques OLD (tableau direct)
 */
export type OldApiResponse = OldItem[];

/**
 * Résultat OLD normalisé pour Mutafriches
 */
export interface OldResultNormalized {
  exposition: boolean; // true si obligation de débroussaillement
  commune: string;
  codeInsee: string;
  dateApprobation?: string;
  urlRisque?: string;
  source: string;
  dateRecuperation: string;
}

/**
 * Paramètres de recherche OLD
 */
export interface OldSearchParams {
  latitude: number;
  longitude: number;
  codeInsee?: string; // Optionnel
}
