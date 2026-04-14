// Types
export type { TagInputData, TagResolver, TagConfig, UsageTagsConfig, GeneratedTags } from "./types";

// Constantes
export {
  SEUIL_GRANDE_PARCELLE,
  SEUIL_EMPRISE_BATI_FAIBLE,
  SEUIL_DISTANCE_TC_PROCHE,
  SEUIL_DISTANCE_RACCORDEMENT_ELEC,
  SEUIL_POIDS_PONDERE_TAG,
  MAX_TAGS_PAR_USAGE,
} from "./constants";

// Resolvers (fallback legacy)
export { generateTagsForUsage, generateAllTags, generateTagsForUsages } from "./resolver";

// Config legacy
export { USAGE_TAGS_CONFIG } from "./config";

// Labels (nouveau : tags basés sur l'algo)
export { getCritereTagLabel } from "./labels";
