import {
  TypeProprietaire,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  RaccordementEau,
} from "@mutafriches/shared-types";
import { SelectOption } from "../types";

/**
 * Configuration des champs de la section "Informations du site"
 */
export const SITE_FIELDS = {
  typeProprietaire: {
    id: "type-proprietaire",
    name: "typeProprietaire",
    label: "Type de propriétaire",
    required: true,
    section: "site" as const,
    options: [
      { value: "", label: "Sélectionner une option" },
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
    label: "Site connecté aux réseaux d'eaux",
    required: true,
    section: "site" as const,
    options: [
      { value: "", label: "Sélectionner une option" },
      { value: RaccordementEau.OUI, label: "Oui" },
      { value: RaccordementEau.NON, label: "Non" },
      { value: RaccordementEau.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<RaccordementEau>[],
  },

  etatBati: {
    id: "etat-bati",
    name: "etatBati",
    label: "État des constructions",
    required: true,
    section: "site" as const,
    options: [
      { value: "", label: "Sélectionner une option" },
      {
        value: EtatBatiInfrastructure.DEGRADATION_TRES_IMPORTANTE,
        label: "Dégradation très importante",
      },
      { value: EtatBatiInfrastructure.DEGRADATION_MOYENNE, label: "Dégradation moyenne" },
      {
        value: EtatBatiInfrastructure.DEGRADATION_INEXISTANTE,
        label: "Dégradation inexistante ou faible",
      },
      { value: EtatBatiInfrastructure.DEGRADATION_HETEROGENE, label: "Dégradation hétérogène" },
      { value: EtatBatiInfrastructure.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<EtatBatiInfrastructure>[],
  },

  presencePollution: {
    id: "presence-pollution",
    name: "presencePollution",
    label: "Présence de pollution",
    required: true,
    section: "site" as const,
    options: [
      { value: "", label: "Sélectionner une option" },
      { value: PresencePollution.NON, label: "Non" },
      { value: PresencePollution.DEJA_GEREE, label: "Déjà gérée" },
      { value: PresencePollution.OUI_COMPOSES_VOLATILS, label: "Oui - composés volatils" },
      { value: PresencePollution.OUI_AUTRES_COMPOSES, label: "Oui - autres composés" },
      { value: PresencePollution.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<PresencePollution>[],
  },

  valeurArchitecturale: {
    id: "valeur-architecturale",
    name: "valeurArchitecturale",
    label: "Intérêt architectural et historique des constructions",
    required: true,
    section: "site" as const,
    options: [
      { value: "", label: "Sélectionner une option" },
      { value: ValeurArchitecturale.SANS_INTERET, label: "Sans intérêt" },
      { value: ValeurArchitecturale.ORDINAIRE, label: "Ordinaire" },
      { value: ValeurArchitecturale.INTERET_REMARQUABLE, label: "Intérêt remarquable" },
      { value: ValeurArchitecturale.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<ValeurArchitecturale>[],
  },
} as const;
