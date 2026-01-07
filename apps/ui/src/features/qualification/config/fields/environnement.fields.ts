import { QualitePaysage, QualiteVoieDesserte } from "@mutafriches/shared-types";
import { FormFieldConfig, SelectOption } from "../types";

/**
 * Configuration des champs de la section "Environnement du site"
 * Ces champs doivent etre remplis manuellement par l'utilisateur
 */
export const ENVIRONNEMENT_FIELDS: Record<string, FormFieldConfig<string>> = {
  qualitePaysage: {
    id: "qualite-paysagere",
    name: "qualitePaysage",
    label: "Interet du paysage environnant",
    required: true,
    section: "environnement",
    options: [
      { value: "", label: "Selectionner une option" },
      { value: QualitePaysage.SANS_INTERET, label: "Sans interet" },
      { value: QualitePaysage.ORDINAIRE, label: "Ordinaire" },
      { value: QualitePaysage.INTERET_REMARQUABLE, label: "Interet remarquable" },
      { value: QualitePaysage.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<QualitePaysage>[],
  },

  qualiteVoieDesserte: {
    id: "qualite-desserte",
    name: "qualiteVoieDesserte",
    label: "Accessibilite par les voies de circulation",
    required: true,
    section: "environnement",
    options: [
      { value: "", label: "Selectionner une option" },
      { value: QualiteVoieDesserte.DEGRADEE, label: "Degradee" },
      { value: QualiteVoieDesserte.PEU_ACCESSIBLE, label: "Peu accessible" },
      { value: QualiteVoieDesserte.ACCESSIBLE, label: "Accessible" },
      { value: QualiteVoieDesserte.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<QualiteVoieDesserte>[],
  },
};

/**
 * Liste des champs environnement sous forme de tableau
 */
export const ENVIRONNEMENT_FIELDS_LIST = Object.values(ENVIRONNEMENT_FIELDS);
