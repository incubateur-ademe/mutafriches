import {
  TypeProprietaire,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  RaccordementEau,
  TrameVerteEtBleue,
  QualitePaysage,
  QualiteVoieDesserte,
} from "@mutafriches/shared-types";

/**
 * Type pour une option de select
 */
export type SelectOption<T = string> = {
  value: T | "";
  label: string;
};

/**
 * Type pour un champ de formulaire
 */
export type FormFieldConfig<T = string> = {
  id: string;
  name: string;
  label: string;
  required: boolean;
  section: "site" | "environnement" | "risques";
  options: SelectOption<T>[];
  hint?: string;
};

/**
 * Type pour les valeurs du formulaire de l'etape Site
 */
export type SiteFormValues = {
  typeProprietaire: TypeProprietaire | "";
  raccordementEau: RaccordementEau | "";
  etatBatiInfrastructure: EtatBatiInfrastructure | "";
  presencePollution: PresencePollution | "";
  valeurArchitecturaleHistorique: ValeurArchitecturale | "";
};

/**
 * Type pour les valeurs du formulaire de l'etape Environnement
 */
export type EnvironnementFormValues = {
  qualitePaysage: QualitePaysage | "";
  qualiteVoieDesserte: QualiteVoieDesserte | "";
  trameVerteEtBleue: TrameVerteEtBleue | "";
};

/**
 * Type pour les valeurs combinees de tous les formulaires manuels
 */
export type ManualFormValues = SiteFormValues & EnvironnementFormValues;

/**
 * Valeurs par defaut du formulaire Site
 */
export const DEFAULT_SITE_VALUES: SiteFormValues = {
  typeProprietaire: "",
  raccordementEau: "",
  etatBatiInfrastructure: "",
  presencePollution: "",
  valeurArchitecturaleHistorique: "",
};

/**
 * Valeurs par defaut du formulaire Environnement
 */
export const DEFAULT_ENVIRONNEMENT_VALUES: EnvironnementFormValues = {
  qualitePaysage: "",
  qualiteVoieDesserte: "",
  trameVerteEtBleue: "",
};

/**
 * Valeurs par defaut combinees
 */
export const DEFAULT_FORM_VALUES: ManualFormValues = {
  ...DEFAULT_SITE_VALUES,
  ...DEFAULT_ENVIRONNEMENT_VALUES,
};

/**
 * Type pour les erreurs de validation
 */
export type ValidationErrors<T> = Partial<Record<keyof T, string>>;
