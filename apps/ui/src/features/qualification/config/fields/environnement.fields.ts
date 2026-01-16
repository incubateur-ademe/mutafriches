import { QualitePaysage, QualiteVoieDesserte, TrameVerteEtBleue } from "@mutafriches/shared-types";
import { FormFieldConfig, SelectOption } from "../types";

const SELECT_OPTION_PLACEHOLDER: SelectOption = { value: "", label: "Selectionner une option" };

/**
 * Configuration des champs de la section "Environnement du site"
 * Ces champs doivent etre remplis manuellement par l'utilisateur
 */
export const ENVIRONNEMENT_FIELDS: Record<string, FormFieldConfig<string>> = {
  qualiteVoieDesserte: {
    id: "qualite-desserte",
    name: "qualiteVoieDesserte",
    label: "Accessibilite par les voies de circulation",
    required: true,
    section: "environnement",
    options: [
      SELECT_OPTION_PLACEHOLDER,
      { value: QualiteVoieDesserte.DEGRADEE, label: "Degradee" },
      { value: QualiteVoieDesserte.PEU_ACCESSIBLE, label: "Peu accessible" },
      { value: QualiteVoieDesserte.ACCESSIBLE, label: "Accessible" },
      { value: QualiteVoieDesserte.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<QualiteVoieDesserte>[],
  },

  qualitePaysage: {
    id: "qualite-paysagere",
    name: "qualitePaysage",
    label: "Interet du paysage environnant",
    required: true,
    section: "environnement",
    options: [
      SELECT_OPTION_PLACEHOLDER,
      { value: QualitePaysage.SANS_INTERET, label: "Sans interet" },
      { value: QualitePaysage.ORDINAIRE, label: "Ordinaire" },
      { value: QualitePaysage.INTERET_REMARQUABLE, label: "Interet remarquable" },
      { value: QualitePaysage.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<QualitePaysage>[],
  },

  trameVerteEtBleue: {
    id: "trame-verte-bleue",
    name: "trameVerteEtBleue",
    label: "Trame verte et bleue",
    required: true,
    section: "environnement",
    options: [
      SELECT_OPTION_PLACEHOLDER,
      { value: TrameVerteEtBleue.HORS_TRAME, label: "Hors trame" },
      { value: TrameVerteEtBleue.RESERVOIR_BIODIVERSITE, label: "Reservoir de biodiversite" },
      { value: TrameVerteEtBleue.CORRIDOR_A_PRESERVER, label: "Corridor a preserver" },
      { value: TrameVerteEtBleue.CORRIDOR_A_RESTAURER, label: "Corridor a restaurer" },
      { value: TrameVerteEtBleue.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<TrameVerteEtBleue>[],
  },
};

/**
 * Liste des champs environnement sous forme de tableau
 */
export const ENVIRONNEMENT_FIELDS_LIST = Object.values(ENVIRONNEMENT_FIELDS);
