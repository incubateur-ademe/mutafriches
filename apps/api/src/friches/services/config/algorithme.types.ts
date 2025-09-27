import { UsageType } from "@mutafriches/shared-types";
import { ScoreImpact } from "./criteres-scoring.config";

// Type helper pour le score par usage
export type ScoreParUsage = {
  [key in UsageType]: number;
};

/**
 * Type helper pour les valeurs de score acceptées
 */
export type ScoreValue = ScoreImpact | number;
