import { TypeUsage, UsageType } from "@mutafriches/shared-types";

export const USAGE_CONFIG = {
  [UsageType.RESIDENTIEL]: {
    label: [TypeUsage.RESIDENTIEL_MIXTE],
    icon: "🏠",
    color: "#18753c",
  },
  [UsageType.EQUIPEMENTS]: {
    label: [TypeUsage.EQUIPEMENTS_PUBLICS],
    icon: "🏛️",
    color: "#0078f3",
  },
  [UsageType.CULTURE]: {
    label: [TypeUsage.CULTURE_TOURISME],
    icon: "🎭",
    color: "#9c27b0",
  },
  [UsageType.TERTIAIRE]: {
    label: [TypeUsage.TERTIAIRE],
    icon: "🏢",
    color: "#ff9800",
  },
  [UsageType.INDUSTRIE]: {
    label: [TypeUsage.INDUSTRIE],
    icon: "🏭",
    color: "#607d8b",
  },
  [UsageType.RENATURATION]: {
    label: [TypeUsage.RENATURATION],
    icon: "🌳",
    color: "#4caf50",
  },
  [UsageType.PHOTOVOLTAIQUE]: {
    label: [TypeUsage.PHOTOVOLTAIQUE],
    icon: "☀️",
    color: "#ffc107",
  },
} as const;

// Helper simple directement dans la config
export const getUsageInfo = (usage: string) => {
  return (
    USAGE_CONFIG[usage as keyof typeof USAGE_CONFIG] || {
      label: usage,
      icon: "📍",
      color: "#666",
    }
  );
};
