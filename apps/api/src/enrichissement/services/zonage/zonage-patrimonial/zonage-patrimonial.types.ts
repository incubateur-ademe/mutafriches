/**
 * Types pour le sous-domaine zonage-patrimonial
 */

/**
 * Résultat de la détection AC1 (Monuments historiques)
 */
export interface ResultatAC1 {
  present: boolean;
  nombreZones: number;
  type?: "monument" | "perimetre";
}

/**
 * Résultat de la détection AC2 (Sites inscrits/classés)
 */
export interface ResultatAC2 {
  present: boolean;
  nombreZones: number;
}

/**
 * Résultat de la détection AC4 (SPR/ZPPAUP/AVAP)
 */
export interface ResultatAC4 {
  present: boolean;
  nombreZones: number;
  type?: "zppaup" | "avap" | "spr";
}

/**
 * Résultat complet de l'évaluation du zonage patrimonial
 */
export interface EvaluationZonagePatrimonial {
  ac1: ResultatAC1 | null;
  ac2: ResultatAC2 | null;
  ac4: ResultatAC4 | null;
  zonageFinal: string;
}
