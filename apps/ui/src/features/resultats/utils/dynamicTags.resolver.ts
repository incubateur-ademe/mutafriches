import { UsageType } from "@mutafriches/shared-types";
import { TagInputData, GeneratedTags } from "./dynamicTags.types";
import { USAGE_TAGS_CONFIG } from "./dynamicTags.config";

/**
 * Génère les tags dynamiques pour un usage donné en fonction des données d'entrée
 *
 * @param usage - Le type d'usage pour lequel générer les tags
 * @param data - Les données d'entrée (enrichissement + données complémentaires)
 * @returns Les tags générés pour cet usage
 */
export function generateTagsForUsage(usage: UsageType, data: TagInputData): GeneratedTags {
  const config = USAGE_TAGS_CONFIG[usage];

  if (!config) {
    return { usage, tags: [] };
  }

  const tags = config
    .map((tagConfig) => tagConfig.resolver(data))
    .filter((tag): tag is string => tag !== null);

  return { usage, tags };
}

/**
 * Génère les tags dynamiques pour tous les usages
 *
 * @param data - Les données d'entrée (enrichissement + données complémentaires)
 * @returns Un Map des tags par usage
 */
export function generateAllTags(data: TagInputData): Map<UsageType, string[]> {
  const result = new Map<UsageType, string[]>();

  for (const usage of Object.values(UsageType)) {
    const { tags } = generateTagsForUsage(usage, data);
    result.set(usage, tags);
  }

  return result;
}

/**
 * Génère les tags dynamiques pour une liste d'usages spécifiques
 *
 * @param usages - Les types d'usage pour lesquels générer les tags
 * @param data - Les données d'entrée (enrichissement + données complémentaires)
 * @returns Un Map des tags par usage
 */
export function generateTagsForUsages(
  usages: UsageType[],
  data: TagInputData,
): Map<UsageType, string[]> {
  const result = new Map<UsageType, string[]>();

  for (const usage of usages) {
    const { tags } = generateTagsForUsage(usage, data);
    result.set(usage, tags);
  }

  return result;
}
