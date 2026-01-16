// Types
export * from "./types";

// Validators
export * from "./validators";

// Champs par section
export { SITE_FIELDS, SITE_FIELDS_LIST } from "./fields/site.fields";
export { ENVIRONNEMENT_FIELDS, ENVIRONNEMENT_FIELDS_LIST } from "./fields/environnement.fields";
export { RISQUES_INFO_CONFIG, RISQUES_INFO_LIST } from "./fields/risques.fields";

// Configuration combinee des champs manuels
import { SITE_FIELDS } from "./fields/site.fields";
import { ENVIRONNEMENT_FIELDS } from "./fields/environnement.fields";

export const FORM_FIELDS_CONFIG = {
  ...SITE_FIELDS,
  ...ENVIRONNEMENT_FIELDS,
} as const;

/**
 * Liste de tous les champs sous forme de tableau
 */
export const FORM_FIELDS_LIST = Object.values(FORM_FIELDS_CONFIG);

/**
 * Helper pour obtenir les champs d'une section
 */
export const getFieldsBySection = (section: "site" | "environnement") => {
  return FORM_FIELDS_LIST.filter((field) => field.section === section);
};
