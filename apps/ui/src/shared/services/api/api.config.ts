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
    enrichissement: {
      enrichir: "/enrichissement",
    },
    evaluation: {
      calculer: "/evaluation/calculer",
      comparer: "/evaluation/comparer",
      algorithmeVersions: "/evaluation/algorithme/versions",
      recuperer: (id: string) => `/evaluation/${id}`,
      metadata: "/evaluation/metadata",
    },
    evenements: {
      enregistrer: "/evenements",
    },
    partenaires: {
      get: (slug: string) => `/api/partenaires/${slug}`,
      sites: (slug: string) => `/api/partenaires/${slug}/sites`,
      renommerSite: (slug: string, id: string) => `/api/partenaires/${slug}/sites/${id}`,
    },
    metabase: {
      embedUrl: "/api/metabase/embed-url",
    },
    donneesExternes: {
      imports: "/api/donnees-externes/imports",
      apis: "/api/donnees-externes/apis",
    },
  },
} as const;
