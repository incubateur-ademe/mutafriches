import {
  TypeProprietaire,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  RaccordementEau,
} from "@mutafriches/shared-types";
import { FormFieldConfig, SelectOption } from "../types";

const SELECT_OPTION_PLACEHOLDER: SelectOption = { value: "", label: "Sélectionner une option" };

/**
 * Configuration des champs de la section "Caractéristiques du site"
 */
export const SITE_FIELDS: Record<string, FormFieldConfig<string>> = {
  typeProprietaire: {
    id: "type-proprietaire",
    name: "typeProprietaire",
    label: "Type de propriétaire",
    required: true,
    section: "site",
    options: [
      SELECT_OPTION_PLACEHOLDER,
      { value: TypeProprietaire.PUBLIC, label: "Public" },
      { value: TypeProprietaire.PRIVE, label: "Privé" },
      { value: TypeProprietaire.MIXTE, label: "Mixte public et privé" },
      { value: TypeProprietaire.COPRO_INDIVISION, label: "Copropriété / Indivision" },
      { value: TypeProprietaire.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<TypeProprietaire>[],
  },

  raccordementEau: {
    id: "reseau-eaux",
    name: "raccordementEau",
    label: "Site connecté aux réseaux d'eau",
    required: true,
    section: "site",
    options: [
      SELECT_OPTION_PLACEHOLDER,
      { value: RaccordementEau.OUI, label: "Oui" },
      { value: RaccordementEau.NON, label: "Non" },
      { value: RaccordementEau.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<RaccordementEau>[],
  },

  etatBatiInfrastructure: {
    id: "etat-bati",
    name: "etatBatiInfrastructure",
    label: "État des constructions",
    required: true,
    section: "site",
    options: [
      SELECT_OPTION_PLACEHOLDER,
      {
        value: EtatBatiInfrastructure.DEGRADATION_INEXISTANTE,
        label: "Dégradation inexistante ou faible",
      },
      { value: EtatBatiInfrastructure.DEGRADATION_MOYENNE, label: "Dégradation moyenne" },
      { value: EtatBatiInfrastructure.DEGRADATION_HETEROGENE, label: "Dégradation hétérogène" },
      {
        value: EtatBatiInfrastructure.DEGRADATION_TRES_IMPORTANTE,
        label: "Dégradation très importante",
      },
      { value: EtatBatiInfrastructure.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<EtatBatiInfrastructure>[],
  },

  presencePollution: {
    id: "presence-pollution",
    name: "presencePollution",
    label: "Présence de pollution",
    required: true,
    section: "site",
    options: [
      SELECT_OPTION_PLACEHOLDER,
      { value: PresencePollution.OUI_COMPOSES_VOLATILS, label: "Oui - composés volatils" },
      { value: PresencePollution.OUI_AUTRES_COMPOSES, label: "Oui - autres composés" },
      { value: PresencePollution.DEJA_GEREE, label: "Déjà gérée" },
      { value: PresencePollution.NON, label: "Non" },
      { value: PresencePollution.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<PresencePollution>[],
  },

  valeurArchitecturaleHistorique: {
    id: "valeur-architecturale",
    name: "valeurArchitecturaleHistorique",
    label: "Intérêt architectural et historique des constructions",
    required: true,
    section: "site",
    options: [
      SELECT_OPTION_PLACEHOLDER,
      { value: ValeurArchitecturale.SANS_INTERET, label: "Sans intérêt" },
      { value: ValeurArchitecturale.ORDINAIRE, label: "Ordinaire" },
      { value: ValeurArchitecturale.INTERET_REMARQUABLE, label: "Intérêt remarquable" },
      { value: ValeurArchitecturale.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<ValeurArchitecturale>[],
  },
};

/**
 * Liste des champs du site sous forme de tableau
 */
export const SITE_FIELDS_LIST = Object.values(SITE_FIELDS);
