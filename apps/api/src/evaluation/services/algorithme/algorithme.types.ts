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
