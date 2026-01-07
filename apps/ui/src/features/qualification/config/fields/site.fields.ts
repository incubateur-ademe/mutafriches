import {
  TypeProprietaire,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  RaccordementEau,
  TrameVerteEtBleue,
} from "@mutafriches/shared-types";
import { FormFieldConfig, SelectOption } from "../types";

/**
 * Configuration des champs de la section "Caracteristiques du site"
 * Ces champs doivent etre remplis manuellement par l'utilisateur
 */
export const SITE_FIELDS: Record<string, FormFieldConfig<string>> = {
  typeProprietaire: {
    id: "type-proprietaire",
    name: "typeProprietaire",
    label: "Type de proprietaire",
    required: true,
    section: "site",
    options: [
      { value: "", label: "Selectionner une option" },
      { value: TypeProprietaire.PUBLIC, label: "Public" },
      { value: TypeProprietaire.PRIVE, label: "Prive" },
      { value: TypeProprietaire.MIXTE, label: "Mixte public et prive" },
      { value: TypeProprietaire.COPRO_INDIVISION, label: "Copropriete / Indivision" },
      { value: TypeProprietaire.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<TypeProprietaire>[],
  },

  raccordementEau: {
    id: "reseau-eaux",
    name: "raccordementEau",
    label: "Site connecte aux reseaux d'eaux",
    required: true,
    section: "site",
    options: [
      { value: "", label: "Selectionner une option" },
      { value: RaccordementEau.OUI, label: "Oui" },
      { value: RaccordementEau.NON, label: "Non" },
      { value: RaccordementEau.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<RaccordementEau>[],
  },

  etatBatiInfrastructure: {
    id: "etat-bati",
    name: "etatBatiInfrastructure",
    label: "Etat des constructions",
    required: true,
    section: "site",
    options: [
      { value: "", label: "Selectionner une option" },
      {
        value: EtatBatiInfrastructure.DEGRADATION_INEXISTANTE,
        label: "Degradation inexistante ou faible",
      },
      { value: EtatBatiInfrastructure.DEGRADATION_MOYENNE, label: "Degradation moyenne" },
      { value: EtatBatiInfrastructure.DEGRADATION_HETEROGENE, label: "Degradation heterogene" },
      {
        value: EtatBatiInfrastructure.DEGRADATION_TRES_IMPORTANTE,
        label: "Degradation tres importante",
      },
      { value: EtatBatiInfrastructure.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<EtatBatiInfrastructure>[],
  },

  presencePollution: {
    id: "presence-pollution",
    name: "presencePollution",
    label: "Presence de pollution",
    required: true,
    section: "site",
    options: [
      { value: "", label: "Selectionner une option" },
      { value: PresencePollution.OUI_COMPOSES_VOLATILS, label: "Oui - composes volatils" },
      { value: PresencePollution.OUI_AUTRES_COMPOSES, label: "Oui - autres composes" },
      { value: PresencePollution.DEJA_GEREE, label: "Deja geree" },
      { value: PresencePollution.NON, label: "Non" },
      { value: PresencePollution.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<PresencePollution>[],
  },

  valeurArchitecturaleHistorique: {
    id: "valeur-architecturale",
    name: "valeurArchitecturaleHistorique",
    label: "Interet architectural et historique des constructions",
    required: true,
    section: "site",
    options: [
      { value: "", label: "Selectionner une option" },
      { value: ValeurArchitecturale.SANS_INTERET, label: "Sans interet" },
      { value: ValeurArchitecturale.ORDINAIRE, label: "Ordinaire" },
      { value: ValeurArchitecturale.INTERET_REMARQUABLE, label: "Interet remarquable" },
      { value: ValeurArchitecturale.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<ValeurArchitecturale>[],
  },

  trameVerteEtBleue: {
    id: "continuite-ecologique",
    name: "trameVerteEtBleue",
    label: "Localisation du site par rapport aux continuites ecologiques (trame verte et bleue)",
    required: true,
    section: "site",
    options: [
      { value: "", label: "Selectionner une option" },
      { value: TrameVerteEtBleue.HORS_TRAME, label: "Hors trame" },
      { value: TrameVerteEtBleue.RESERVOIR_BIODIVERSITE, label: "Reservoir de biodiversite" },
      { value: TrameVerteEtBleue.CORRIDOR_A_PRESERVER, label: "Corridor a preserver" },
      { value: TrameVerteEtBleue.CORRIDOR_A_RESTAURER, label: "Corridor a restaurer" },
      { value: TrameVerteEtBleue.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<TrameVerteEtBleue>[],
  },
};

/**
 * Liste des champs du site sous forme de tableau
 */
export const SITE_FIELDS_LIST = Object.values(SITE_FIELDS);
