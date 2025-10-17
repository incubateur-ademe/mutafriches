const getApiUrl = (): string => {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || "http://localhost:3000";
  }

  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  return window.location.origin;
};

export const API_CONFIG = {
  baseUrl: getApiUrl(),
  endpoints: {
    friches: {
      enrichir: "/friches/enrichir",
      calculer: "/friches/calculer",
    },
    evenements: {
      enregistrer: "/evenements",
    },
  },
} as const;
