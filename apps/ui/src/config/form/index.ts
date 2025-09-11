// Types
export * from "./types";

// Validators
export * from "./validators";

// Champs par section
export { SITE_FIELDS } from "./fields/site.fields";
export { ENVIRONNEMENT_FIELDS } from "./fields/environnement.fields";

// Configuration combinée
import { SITE_FIELDS } from "./fields/site.fields";
import { ENVIRONNEMENT_FIELDS } from "./fields/environnement.fields";

export const FORM_FIELDS_CONFIG = {
  ...SITE_FIELDS,
  ...ENVIRONNEMENT_FIELDS,
} as const;

// Helper pour obtenir la liste des champs sous forme de tableau
export const FORM_FIELDS_LIST = Object.values(FORM_FIELDS_CONFIG);
