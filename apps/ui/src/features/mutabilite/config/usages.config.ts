export const USAGE_CONFIG = {
  "Résidentiel ou mixte": {
    label: "Logement et commerces de proximité",
    icon: "🏠",
    color: "#18753c",
  },
  "Équipements publics": {
    label: "Équipements publics",
    icon: "🏛️",
    color: "#0078f3",
  },
  "Culture, tourisme": {
    label: "Culture et tourisme",
    icon: "🎭",
    color: "#9c27b0",
  },
  Tertiaire: {
    label: "Bureaux et activités tertiaires",
    icon: "🏢",
    color: "#ff9800",
  },
  Industrie: {
    label: "Activités industrielles",
    icon: "🏭",
    color: "#607d8b",
  },
  Renaturation: {
    label: "Renaturation et biodiversité",
    icon: "🌳",
    color: "#4caf50",
  },
  "Photovoltaïque au sol": {
    label: "Énergie solaire",
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
