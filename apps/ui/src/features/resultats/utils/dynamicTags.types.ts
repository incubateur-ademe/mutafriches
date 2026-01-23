import {
  UsageType,
  EnrichissementOutputDto,
  DonneesComplementairesInputDto,
} from "@mutafriches/shared-types";

/**
 * Données d'entrée combinées pour la génération des tags
 */
export interface TagInputData {
  enrichmentData: EnrichissementOutputDto;
  manualData: DonneesComplementairesInputDto;
}

/**
 * Fonction qui détermine si un tag doit être affiché et retourne son libellé
 * Retourne null si le tag ne doit pas être affiché
 */
export type TagResolver = (data: TagInputData) => string | null;

/**
 * Configuration d'un tag pour un usage donné
 */
export interface TagConfig {
  /** Identifiant unique du critère */
  critereId: string;
  /** Fonction de résolution du tag */
  resolver: TagResolver;
}

/**
 * Configuration complète des tags par usage
 */
export type UsageTagsConfig = Record<UsageType, TagConfig[]>;

/**
 * Résultat de la génération des tags pour un usage
 */
export interface GeneratedTags {
  usage: UsageType;
  tags: string[];
}
