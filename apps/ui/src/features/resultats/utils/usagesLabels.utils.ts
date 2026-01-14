import { UsageType } from "@mutafriches/shared-types";

const USAGE_CONFIG = {
  [UsageType.RESIDENTIEL]: {
    label: "Habitat et commerce de proximité",
    icon: "🏠",
  },
  [UsageType.EQUIPEMENTS]: {
    label: "Équipements publics",
    icon: "🏛️",
  },
  [UsageType.CULTURE]: {
    label: "Equipements culturels et touristiques",
    icon: "🎭",
  },
  [UsageType.TERTIAIRE]: {
    label: "Bureaux",
    icon: "🏢",
  },
  [UsageType.INDUSTRIE]: {
    label: "Industrie",
    icon: "🏭",
  },
  [UsageType.RENATURATION]: {
    label: "Espace renaturé",
    icon: "🌳",
  },
  [UsageType.PHOTOVOLTAIQUE]: {
    label: "Centrale photovoltaique au sol",
    icon: "☀️",
  },
} as const;

export const getUsageInfo = (usage: string) => {
  const usageType = usage as UsageType;
  const config = USAGE_CONFIG[usageType];

  if (!config) {
    return {
      label: usage,
      icon: "📍",
    };
  }

  return config;
};
