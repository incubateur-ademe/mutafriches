import { QualitePaysage, QualiteVoieDesserte } from "@mutafriches/shared-types";
import { SelectOption } from "../types";

/**
 * Configuration des champs de la section "Environnement du site"
 */
export const ENVIRONNEMENT_FIELDS = {
  qualitePaysagere: {
    id: "qualite-paysagere",
    name: "qualitePaysagere",
    label: "Intérêt du paysage environnant",
    required: true,
    section: "environnement" as const,
    options: [
      { value: "", label: "Sélectionner une option" },
      { value: QualitePaysage.DEGRADE, label: "Sans intérêt" },
      { value: QualitePaysage.BANAL_INFRA_ORDINAIRE, label: "Ordinaire" },
      { value: QualitePaysage.REMARQUABLE, label: "Intérêt remarquable" },
      { value: QualitePaysage.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<QualitePaysage>[],
  },

  qualiteDesserte: {
    id: "qualite-desserte",
    name: "qualiteDesserte",
    label: "Accessibilité par les voies de circulation",
    required: true,
    section: "environnement" as const,
    options: [
      { value: "", label: "Sélectionner une option" },
      { value: QualiteVoieDesserte.ACCESSIBLE, label: "Accessible" },
      { value: QualiteVoieDesserte.DEGRADEE, label: "Dégradée" },
      { value: QualiteVoieDesserte.PEU_ACCESSIBLE, label: "Peu accessible" },
      { value: QualiteVoieDesserte.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<QualiteVoieDesserte>[],
  },
} as const;
