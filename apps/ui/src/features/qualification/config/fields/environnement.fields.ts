import { QualitePaysage, QualiteVoieDesserte, TrameVerteEtBleue } from "@mutafriches/shared-types";
import { FormFieldConfig, SelectOption } from "../types";

const SELECT_OPTION_PLACEHOLDER: SelectOption = { value: "", label: "Sélectionner une option" };

/**
 * Configuration des champs de la section "Environnement du site"
 * Ces champs doivent être remplis manuellement par l'utilisateur
 */
export const ENVIRONNEMENT_FIELDS: Record<string, FormFieldConfig<string>> = {
  qualiteVoieDesserte: {
    id: "qualite-desserte",
    name: "qualiteVoieDesserte",
    label: "Accessibilité par les voies de circulation",
    required: true,
    section: "environnement",
    options: [
      SELECT_OPTION_PLACEHOLDER,
      { value: QualiteVoieDesserte.DEGRADEE, label: "Dégradée" },
      { value: QualiteVoieDesserte.PEU_ACCESSIBLE, label: "Peu accessible" },
      { value: QualiteVoieDesserte.ACCESSIBLE, label: "Accessible" },
      { value: QualiteVoieDesserte.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<QualiteVoieDesserte>[],
  },

  qualitePaysage: {
    id: "qualite-paysagere",
    name: "qualitePaysage",
    label: "Intérêt du paysage environnant",
    required: true,
    section: "environnement",
    options: [
      SELECT_OPTION_PLACEHOLDER,
      { value: QualitePaysage.SANS_INTERET, label: "Sans intérêt" },
      { value: QualitePaysage.ORDINAIRE, label: "Ordinaire" },
      { value: QualitePaysage.INTERET_REMARQUABLE, label: "Intérêt remarquable" },
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
      { value: TrameVerteEtBleue.RESERVOIR_BIODIVERSITE, label: "Réservoir de biodiversité" },
      { value: TrameVerteEtBleue.CORRIDOR_A_PRESERVER, label: "Corridor à préserver" },
      { value: TrameVerteEtBleue.CORRIDOR_A_RESTAURER, label: "Corridor à restaurer" },
      { value: TrameVerteEtBleue.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<TrameVerteEtBleue>[],
  },
};

/**
 * Liste des champs environnement sous forme de tableau
 */
export const ENVIRONNEMENT_FIELDS_LIST = Object.values(ENVIRONNEMENT_FIELDS);
