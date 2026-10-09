import type { ImpactNiveau } from "@mutafriches/shared-types";

// Couleurs des tags, relevées sur la maquette Figma « Refonte tags ». Partagées avec l'export PDF.
export type TagVariant =
  "bleu" | "rose" | "vert-fort" | "vert" | "jaune" | "saumon-pale" | "saumon" | "rouge-plein";

export interface TagColors {
  textColor: string;
  backgroundColor: string;
}

export const TAG_COLORS: Record<TagVariant, TagColors> = {
  bleu: { textColor: "#3A3A3A", backgroundColor: "#E8EDFF" },
  rose: { textColor: "#6E445A", backgroundColor: "#FEE7FC" },
  "vert-fort": { textColor: "#18753C", backgroundColor: "#B8FEC9" },
  vert: { textColor: "#208D49", backgroundColor: "#C9FCAC" },
  jaune: { textColor: "#716043", backgroundColor: "#FEECC2" },
  "saumon-pale": { textColor: "#755348", backgroundColor: "#FEDED9" },
  saumon: { textColor: "#8D533E", backgroundColor: "#FFBDBE" },
  "rouge-plein": { textColor: "#FFFFFF", backgroundColor: "#FB7676" },
};

// Partagé avec l'export PDF
export const IMPACT_TAG_VARIANT: Record<ImpactNiveau, TagVariant> = {
  "tres-positif": "vert-fort",
  positif: "vert",
  neutre: "bleu",
  negatif: "saumon-pale",
  "tres-negatif": "saumon",
  bloquant: "rouge-plein",
};
