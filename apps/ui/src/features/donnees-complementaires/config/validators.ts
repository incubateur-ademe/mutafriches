import { ManualFormValues } from "./types";
import { SITE_FIELDS } from "./fields/site.fields";
import { ENVIRONNEMENT_FIELDS } from "./fields/environnement.fields";

// Combine tous les champs
const ALL_FIELDS = {
  ...SITE_FIELDS,
  ...ENVIRONNEMENT_FIELDS,
} as const;

/**
 * Type pour les erreurs de validation
 */
export type ValidationErrors = Partial<Record<keyof ManualFormValues, string>>;

/**
 * Résultat de validation simplifié
 */
export type ValidationResult = {
  isValid: boolean;
  errors: ValidationErrors;
};

/**
 * Valide tout le formulaire
 * Vérifie juste que tous les champs requis ont une valeur
 */
export const validateForm = (values: ManualFormValues): ValidationResult => {
  const errors: ValidationErrors = {};

  // Parcourir tous les champs
  Object.entries(ALL_FIELDS).forEach(([key, field]) => {
    if (field.required) {
      const value = values[key as keyof ManualFormValues];
      if (!value) {
        errors[key as keyof ManualFormValues] = `${field.label} est obligatoire`;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Helper pour obtenir tous les champs d'une section
 */
export const getFieldsBySection = (section: "site" | "environnement") => {
  return Object.values(ALL_FIELDS).filter((field) => field.section === section);
};

/**
 * Helper simple pour vérifier si le formulaire est complet
 */
export const isFormComplete = (values: ManualFormValues): boolean => {
  // Vérifier que tous les champs requis ont une valeur
  return Object.entries(ALL_FIELDS).every(([key, field]) => {
    if (!field.required) return true;
    return Boolean(values[key as keyof ManualFormValues]);
  });
};
