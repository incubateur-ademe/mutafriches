/**
 * Types pour le sous-domaine risques-technologiques
 */

/**
 * Résultat de l'analyse SIS
 */
export interface ResultatSis {
  presenceSis: boolean;
}

/**
 * Résultat de l'analyse ICPE
 */
export interface ResultatIcpe {
  nombreIcpe: number;
  distancePlusProche?: number;
}

/**
 * Résultat complet de l'évaluation des risques technologiques
 */
export interface EvaluationRisquesTechnologiques {
  sis: ResultatSis | null;
  icpe: ResultatIcpe | null;
  risqueFinal: boolean;
}
