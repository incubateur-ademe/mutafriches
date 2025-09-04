import { PertinenceReponse, UsageType } from "../enums/mutability.enums";
import { mutabilityResults } from "../schemas/mutability.schema";

// Types inférés depuis le schéma
export type MutabilityResult = typeof mutabilityResults.$inferSelect;
export type NewMutabilityResult = typeof mutabilityResults.$inferInsert;

// Types métier pour la mutabilité
export interface UsageIndices {
  residentiel: number;
  equipements: number;
  culture: number;
  tertiaire: number;
  industrie: number;
  renaturation: number;
  photovoltaique: number;
}

export interface MutabilityAnalysis {
  indices: UsageIndices;
  fiabilite: number;
  bestUsage: UsageType;
  worstUsage: UsageType;
  pertinenceReponse?: PertinenceReponse;
}

export interface UsageRanking {
  usage: UsageType;
  indice: number;
  rank: number;
}
