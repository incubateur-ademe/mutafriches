/**
 * Types communs partagés
 */

import { SourceUtilisation } from "../enums/usage.enums";

/**
 * Coordonnées géographiques GPS
 */
export interface Coordonnees {
  latitude: number;
  longitude: number;
}

/**
 * Origine de l'utilisation de l'API
 */
export interface OrigineUtilisation {
  source: SourceUtilisation;
  integrateur?: string;
}
