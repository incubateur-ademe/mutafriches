/**
 * Types pour le sous-domaine zonage-environnemental
 */

/**
 * Résultat de la détection Natura 2000
 */
export interface ResultatNatura2000 {
  present: boolean;
  nombreZones: number;
}

/**
 * Résultat de la détection ZNIEFF
 */
export interface ResultatZnieff {
  present: boolean;
  type1: boolean;
  type2: boolean;
  nombreZones: number;
}

/**
 * Résultat de la détection Parc Naturel
 */
export interface ResultatParcNaturel {
  present: boolean;
  type: 'regional' | 'national' | null;
  nom?: string;
}

/**
 * Résultat de la détection Réserve Naturelle
 */
export interface ResultatReserveNaturelle {
  present: boolean;
  nombreReserves: number;
}

/**
 * Résultat complet de l'évaluation du zonage environnemental
 */
export interface EvaluationZonageEnvironnemental {
  natura2000: ResultatNatura2000 | null;
  znieff: ResultatZnieff | null;
  parcNaturel: ResultatParcNaturel | null;
  reserveNaturelle: ResultatReserveNaturelle | null;
  zonageFinal: string;
}
