import { UsageType } from "@mutafriches/shared-types";

/**
 * Enum représentant les niveaux d'impact pour le calcul de mutabilité
 * Correspondance avec les valeurs Excel : Très négatif, Négatif, Neutre, Positif, Très positif
 */
export enum ScoreImpact {
  TRES_NEGATIF = -2,
  NEGATIF = -1,
  NEUTRE = 0.5,
  POSITIF = 1,
  TRES_POSITIF = 2,
}

/**
 * Type helper pour le score par usage
 */
export type ScoreParUsage = {
  [key in UsageType]: number;
};

/**
 * Type helper pour les valeurs de score acceptées
 */
export type ScoreValue = ScoreImpact | number;

// Une condition porte sur la valeur d'un critère telle que scorée (après extraireCriteres)
export interface ConditionExclusion {
  critere: string;
  valeur: string | boolean;
}

// Usages rendus impossibles quand TOUTES les conditions sont vérifiées, quel que soit l'indice
export interface RegleExclusion {
  id: string;
  usages: UsageType[];
  conditions: ConditionExclusion[];
}

/**
 * Configuration d'une version de l'algorithme de mutabilité
 */
export interface AlgorithmeConfig {
  version: string;
  label: string;
  date: string;
  poidsCriteres: Record<string, number>;
  matriceScoring: Record<string, unknown>;
  // Absent avant v1.16 : aucune exclusion, les évaluations passées restent reproductibles
  reglesExclusion?: RegleExclusion[];
}
