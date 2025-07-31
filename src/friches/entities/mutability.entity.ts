import type { mutabilityResults } from '../friches/schemas/mutability.schema';

// Types inférés depuis le schéma
export type MutabilityResult = typeof mutabilityResults.$inferSelect;
export type NewMutabilityResult = typeof mutabilityResults.$inferInsert;

// Enum pour les usages
export const UsageTypes = {
  RESIDENTIEL: 'residentiel',
  EQUIPEMENTS: 'equipements',
  CULTURE: 'culture',
  TERTIAIRE: 'tertiaire',
  INDUSTRIE: 'industrie',
  RENATURATION: 'renaturation',
  PHOTOVOLTAIQUE: 'photovoltaique',
} as const;

export type UsageType = (typeof UsageTypes)[keyof typeof UsageTypes];

export const PertinenceReponses = {
  OUI: 'OUI',
  NON: 'NON',
} as const;

export type PertinenceReponse =
  (typeof PertinenceReponses)[keyof typeof PertinenceReponses];

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
