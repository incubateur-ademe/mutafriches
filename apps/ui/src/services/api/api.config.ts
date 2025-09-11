/**
 * Configuration des URLs d'API selon l'environnement
 */

const getApiUrl = (): string => {
  // En développement local
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || "http://localhost:3000";
  }

  // En production/staging, utiliser l'URL relative (même domaine)
  // ou une variable d'environnement si définie
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Par défaut, utiliser l'URL relative (frontend et backend sur le même domaine)
  return window.location.origin;
};

export const API_CONFIG = {
  baseUrl: getApiUrl(),
  endpoints: {
    enrichirParcelle: "/friches/parcelle/enrichir",
    calculerMutabilite: "/friches/parcelle/mutabilite",
  },
};
