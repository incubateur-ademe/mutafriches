/**
 * Types pour le sous-domaine risques-naturels
 */

import { RisqueNaturel } from "@mutafriches/shared-types";

/**
 * Résultat de l'analyse RGA
 */
export interface ResultatRga {
  alea: string;
  risque: RisqueNaturel;
}

/**
 * Résultat de l'analyse Cavités
 */
export interface ResultatCavites {
  exposition: boolean;
  nombreCavites: number;
  distancePlusProche?: number;
  risque: RisqueNaturel;
}

/**
 * Résultat complet de l'évaluation des risques naturels
 */
export interface EvaluationRisquesNaturels {
  rga: ResultatRga | null;
  cavites: ResultatCavites | null;
  risqueFinal: RisqueNaturel;
}
