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
    // Nouveaux endpoints DDD
    enrichissement: {
      enrichir: "/enrichissement",
    },
    evaluation: {
      calculer: "/evaluation/calculer",
      recuperer: (id: string) => `/evaluation/${id}`,
      metadata: "/evaluation/metadata",
    },
    evenements: {
      enregistrer: "/evenements",
    },
    metabase: {
      embedUrl: "/api/metabase/embed-url",
    },
    // Legacy endpoints (deprecated - pour compatibilité)
    friches: {
      enrichir: "/friches/enrichir",
      calculer: "/friches/calculer",
    },
  },
} as const;
