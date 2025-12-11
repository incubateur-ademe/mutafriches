import {
  TypeProprietaire,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
  RaccordementEau,
  TrameVerteEtBleue,
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
  section: "site" | "environnement";
  options: SelectOption<T>[];
};

/**
 * Type pour les valeurs du formulaire manuel
 */
export type ManualFormValues = {
  typeProprietaire: TypeProprietaire | "";
  raccordementEau: RaccordementEau | "";
  etatBatiInfrastructure: EtatBatiInfrastructure | "";
  presencePollution: PresencePollution | "";
  valeurArchitecturaleHistorique: ValeurArchitecturale | "";
  qualitePaysage: QualitePaysage | "";
  qualiteVoieDesserte: QualiteVoieDesserte | "";
  trameVerteEtBleue: TrameVerteEtBleue | "";
};

/**
 * Valeurs par défaut du formulaire
 */
export const DEFAULT_FORM_VALUES: ManualFormValues = {
  typeProprietaire: "",
  raccordementEau: "",
  etatBatiInfrastructure: "",
  presencePollution: "",
  valeurArchitecturaleHistorique: "",
  qualitePaysage: "",
  qualiteVoieDesserte: "",
  trameVerteEtBleue: "",
};
