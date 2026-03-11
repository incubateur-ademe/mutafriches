/**
 * Types pour le sous-domaine risques-naturels
 */

import {
  RisqueRetraitGonflementArgile,
  RisqueCavitesSouterraines,
  RisqueInondation,
} from "@mutafriches/shared-types";

/**
 * Résultat de l'analyse RGA
 */
export interface ResultatRga {
  alea: string;
  risque: RisqueRetraitGonflementArgile;
}

/**
 * Résultat de l'analyse Cavités
 */
export interface ResultatCavites {
  exposition: boolean;
  nombreCavites: number;
  distancePlusProche?: number;
  risque: RisqueCavitesSouterraines;
}

/**
 * Résultat de l'analyse Inondation
 */
export interface ResultatInondation {
  tri: boolean;
  azi: boolean;
  papi: boolean;
  ppr: boolean;
  risque: RisqueInondation;
}

/**
 * Résultat complet de l'évaluation des risques naturels (3 critères séparés)
 */
export interface EvaluationRisquesNaturels {
  rga: ResultatRga | null;
  cavites: ResultatCavites | null;
  inondation: ResultatInondation | null;
  risqueRetraitGonflementArgile: RisqueRetraitGonflementArgile;
  risqueCavitesSouterraines: RisqueCavitesSouterraines;
  risqueInondation: RisqueInondation;
}
