/**
 * Types généraux pour l'API GeoRisques
 */

import { CatnatResultNormalized } from "./catnat/catnat.types";
import { MvtResultNormalized } from "./mvt/mvt.types";
import { RgaResultNormalized } from "./rga/rga.types";
import { TriResultNormalized } from "./tri/tri.types";

/**
 * Paramètres de recherche géographique communs
 */
export interface GeoRisquesSearchParams {
  latitude: number;
  longitude: number;
  rayon?: number; // en mètres
  codeInsee?: string;
}

/**
 * Réponse générique de l'API GeoRisques
 */
export interface GeoRisquesApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

/**
 * Métadonnées d'appel API
 */
export interface GeoRisquesMetadata {
  source: string;
  dateAppel: string;
  success: boolean;
  responseTimeMs?: number;
}

/**
 * Résultat agrégé de tous les risques GeoRisques
 * Sera enrichi progressivement avec les autres risques
 */
export interface GeoRisquesResult {
  rga?: RgaResultNormalized;
  catnat?: CatnatResultNormalized;
  triZonage?: TriResultNormalized;
  mvt?: MvtResultNormalized;

  metadata: {
    sourcesUtilisees: string[];
    sourcesEchouees: string[];
    fiabilite: number;
  };
}
