import { QualitePaysage, QualiteVoieDesserte } from "@mutafriches/shared-types";
import { SelectOption } from "../types";

/**
 * Configuration des champs de la section "Environnement du site"
 */
export const ENVIRONNEMENT_FIELDS = {
  qualitePaysagere: {
    id: "qualite-paysagere",
    name: "qualitePaysage",
    label: "Intérêt du paysage environnant",
    required: true,
    section: "environnement" as const,
    options: [
      { value: "", label: "Sélectionner une option" },
      { value: QualitePaysage.SANS_INTERET, label: "Sans intérêt" },
      { value: QualitePaysage.ORDINAIRE, label: "Ordinaire" },
      { value: QualitePaysage.INTERET_REMARQUABLE, label: "Intérêt remarquable" },
      { value: QualitePaysage.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<QualitePaysage>[],
  },

  qualiteDesserte: {
    id: "qualite-desserte",
    name: "qualiteVoieDesserte",
    label: "Accessibilité par les voies de circulation",
    required: true,
    section: "environnement" as const,
    options: [
      { value: "", label: "Sélectionner une option" },
      { value: QualiteVoieDesserte.DEGRADEE, label: "Dégradée" },
      { value: QualiteVoieDesserte.PEU_ACCESSIBLE, label: "Peu accessible" },
      { value: QualiteVoieDesserte.ACCESSIBLE, label: "Accessible" },
      { value: QualiteVoieDesserte.NE_SAIT_PAS, label: "Ne sait pas" },
    ] as SelectOption<QualiteVoieDesserte>[],
  },
} as const;
