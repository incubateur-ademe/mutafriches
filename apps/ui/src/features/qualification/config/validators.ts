import { SiteFormValues, EnvironnementFormValues, ValidationErrors } from "./types";
import { SITE_FIELDS_LIST } from "./fields/site.fields";
import { ENVIRONNEMENT_FIELDS_LIST } from "./fields/environnement.fields";

/**
 * Valide les champs du formulaire Site
 */
export const validateSiteForm = (values: SiteFormValues): ValidationErrors<SiteFormValues> => {
  const errors: ValidationErrors<SiteFormValues> = {};

  SITE_FIELDS_LIST.forEach((field) => {
    if (field.required && !values[field.name as keyof SiteFormValues]) {
      errors[field.name as keyof SiteFormValues] = "Ce champ est obligatoire";
    }
  });

  return errors;
};

/**
 * Valide les champs du formulaire Environnement
 */
export const validateEnvironnementForm = (
  values: EnvironnementFormValues,
): ValidationErrors<EnvironnementFormValues> => {
  const errors: ValidationErrors<EnvironnementFormValues> = {};

  ENVIRONNEMENT_FIELDS_LIST.forEach((field) => {
    if (field.required && !values[field.name as keyof EnvironnementFormValues]) {
      errors[field.name as keyof EnvironnementFormValues] = "Ce champ est obligatoire";
    }
  });

  return errors;
};

/**
 * Verifie si le formulaire Site est valide
 */
export const isSiteFormValid = (values: SiteFormValues): boolean => {
  return Object.keys(validateSiteForm(values)).length === 0;
};

/**
 * Verifie si le formulaire Environnement est valide
 */
export const isEnvironnementFormValid = (values: EnvironnementFormValues): boolean => {
  return Object.keys(validateEnvironnementForm(values)).length === 0;
};
