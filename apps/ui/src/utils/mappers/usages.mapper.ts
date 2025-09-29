import { UsageType } from "@mutafriches/shared-types";

export const UsageLabels: Record<UsageType, string> = {
  [UsageType.RESIDENTIEL]: "Habitat et commerce de proximité",
  [UsageType.EQUIPEMENTS]: "Équipements publics",
  [UsageType.CULTURE]: "Equipements culturels et touristiques",
  [UsageType.TERTIAIRE]: "Bureaux",
  [UsageType.INDUSTRIE]: "Industrie",
  [UsageType.RENATURATION]: "Espace renaturé",
  [UsageType.PHOTOVOLTAIQUE]: "Centrale photovoltaique au sol",
};

// Configuration UI pour chaque usage (icônes et couleurs)
export const USAGE_UI_CONFIG = {
  [UsageType.RESIDENTIEL]: {
    icon: "🏠",
    color: "#18753c",
  },
  [UsageType.EQUIPEMENTS]: {
    icon: "🏛️",
    color: "#0078f3",
  },
  [UsageType.CULTURE]: {
    icon: "🎭",
    color: "#9c27b0",
  },
  [UsageType.TERTIAIRE]: {
    icon: "🏢",
    color: "#ff9800",
  },
  [UsageType.INDUSTRIE]: {
    icon: "🏭",
    color: "#607d8b",
  },
  [UsageType.RENATURATION]: {
    icon: "🌳",
    color: "#4caf50",
  },
  [UsageType.PHOTOVOLTAIQUE]: {
    icon: "☀️",
    color: "#ffc107",
  },
} as const;

// Helper pour récupérer toutes les infos d'un usage
export const getUsageInfo = (usage: string) => {
  const usageType = usage as UsageType;
  const uiConfig = USAGE_UI_CONFIG[usageType];

  if (!uiConfig) {
    return {
      label: usage,
      icon: "📍",
      color: "#666",
    };
  }

  return {
    label: UsageLabels[usageType],
    icon: uiConfig.icon,
    color: uiConfig.color,
  };
};
