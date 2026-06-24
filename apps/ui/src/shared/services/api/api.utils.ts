import { STORAGE_KEYS } from "../../config/storage-keys.config";
import type { ApiError, ApiErrorResponse } from "./api.types";

/**
 * Génère un ID de session unique (par chargement d'app, non persisté)
 */
export const generateSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/** Identifiant visiteur en mémoire si localStorage indisponible (navigation privée, storage tiers bloqué) */
let visitorIdMemoryFallback: string | undefined;

/** Génère un UUID anonyme, avec repli si crypto.randomUUID indisponible */
const genererUuid = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 10)}`;
};

/**
 * Récupère (ou crée) un identifiant visiteur anonyme stable entre visites.
 * Persisté en localStorage ; repli en mémoire si le storage est inaccessible.
 */
export const getOrCreateVisitorId = (): string => {
  try {
    const existant = window.localStorage.getItem(STORAGE_KEYS.VISITOR_ID);
    if (existant) return existant;
    const nouveau = genererUuid();
    window.localStorage.setItem(STORAGE_KEYS.VISITOR_ID, nouveau);
    return nouveau;
  } catch {
    // localStorage indisponible : repli en mémoire pour la durée de la session
    if (!visitorIdMemoryFallback) {
      visitorIdMemoryFallback = genererUuid();
    }
    return visitorIdMemoryFallback;
  }
};

/**
 * Construit une URL avec query params
 */
export const buildUrlWithParams = (baseUrl: string, params?: Record<string, string>): string => {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.append(key, value);
  });

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

/**
 * Extrait le message d'erreur d'une réponse API
 */
export const extractErrorMessage = async (
  response: Response,
): Promise<{ message: string; statusCode: number; error?: string }> => {
  try {
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const errorData = (await response.json()) as ApiErrorResponse;
      return {
        message: errorData.message || getDefaultErrorMessage(response.status),
        statusCode: errorData.statusCode || response.status,
        error: errorData.error,
      };
    }

    const textError = await response.text();
    if (textError) {
      try {
        const jsonError = JSON.parse(textError) as ApiErrorResponse;
        return {
          message: jsonError.message || textError,
          statusCode: jsonError.statusCode || response.status,
          error: jsonError.error,
        };
      } catch {
        return {
          message: textError,
          statusCode: response.status,
          error: undefined,
        };
      }
    }
  } catch (parseError) {
    console.error("Erreur lors du parsing de l'erreur:", parseError);
  }

  return {
    message: getDefaultErrorMessage(response.status),
    statusCode: response.status,
    error: response.statusText,
  };
};

/**
 * Retourne un message par défaut selon le code HTTP
 */
export const getDefaultErrorMessage = (status: number): string => {
  switch (status) {
    case 400:
      return "Données invalides ou incomplètes";
    case 404:
      return "Ressource non trouvée";
    case 500:
      return "Erreur serveur, veuillez réessayer plus tard";
    case 503:
      return "Service temporairement indisponible";
    default:
      return `Erreur ${status}`;
  }
};

/**
 * Détermine si une erreur est liée au réseau
 */
export const isNetworkError = (error: unknown): boolean => {
  return (
    error instanceof TypeError &&
    (error.message === "Failed to fetch" || error.message.includes("network"))
  );
};

/**
 * Obtient des suggestions selon le type d'erreur
 */
export const getErrorSuggestions = (error: ApiError): string[] => {
  const suggestions: string[] = [];

  if (error.statusCode === 404 || error.message.toLowerCase().includes("introuvable")) {
    suggestions.push(
      "Vérifiez que l'identifiant est correct",
      "Consultez la documentation pour le format attendu",
    );
  } else if (error.statusCode === 400 || error.message.toLowerCase().includes("invalide")) {
    suggestions.push(
      "Vérifiez le format des données saisies",
      "Assurez-vous que tous les champs requis sont remplis",
    );
  } else if (error.statusCode === 503 || error.message.toLowerCase().includes("connexion")) {
    suggestions.push(
      "Vérifiez votre connexion Internet",
      "Réessayez dans quelques instants",
      "Si le problème persiste, contactez le support",
    );
  }

  return suggestions;
};
