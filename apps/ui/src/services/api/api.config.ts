// apps/ui/src/services/api/config.ts

/**
 * Configuration de base pour l'API
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Headers par défaut pour les requêtes
 */
export const DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
};

/**
 * Options par défaut pour fetch
 */
export const DEFAULT_FETCH_OPTIONS = {
  credentials: "include" as const, // Pour inclure les cookies de session
};
