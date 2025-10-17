// TODO : Better error handling and typing
import {
  EnrichissementOutputDto,
  CalculerMutabiliteInputDto,
  MutabiliteOutputDto,
} from "@mutafriches/shared-types";
import { API_CONFIG } from "../../config/api.config";
import { isValidParcelId } from "../../utils/validation.utils";
import { buildMutabilityInput } from "../../../features/mutabilite/utils/mutability.mapper";

// Type pour la réponse d'erreur de l'API
interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}

// Type pour les erreurs customisées
export class ApiError extends Error {
  statusCode: number;
  error?: string;

  constructor(message: string, statusCode: number, error?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.error = error;
  }
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
  }

  /**
   * Extrait le message d'erreur d'une réponse API
   */
  private async extractErrorMessage(
    response: Response,
  ): Promise<{ message: string; statusCode: number; error?: string }> {
    try {
      const contentType = response.headers.get("content-type");

      // Si la réponse est en JSON
      if (contentType && contentType.includes("application/json")) {
        const errorData = (await response.json()) as ApiErrorResponse;

        // Retourner les détails de l'erreur
        return {
          message: errorData.message || this.getDefaultMessage(response.status),
          statusCode: errorData.statusCode || response.status,
          error: errorData.error,
        };
      }

      // Si ce n'est pas du JSON, essayer de lire comme texte
      const textError = await response.text();
      if (textError) {
        // Essayer de parser si c'est du JSON malgré le content-type
        try {
          const jsonError = JSON.parse(textError) as ApiErrorResponse;
          return {
            message: jsonError.message || textError,
            statusCode: jsonError.statusCode || response.status,
            error: jsonError.error,
          };
        } catch {
          // Si ce n'est vraiment pas du JSON
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

    // Message par défaut selon le code de statut
    return {
      message: this.getDefaultMessage(response.status),
      statusCode: response.status,
      error: response.statusText,
    };
  }

  /**
   * Retourne un message par défaut selon le code HTTP
   */
  private getDefaultMessage(status: number): string {
    switch (status) {
      case 400:
        return "Données invalides ou incomplètes";
      case 404:
        return "Parcelle non trouvée";
      case 500:
        return "Erreur serveur, veuillez réessayer plus tard";
      case 503:
        return "Service temporairement indisponible";
      default:
        return `Erreur ${status}`;
    }
  }

  /**
   * Enrichir une parcelle par son identifiant
   */
  async enrichirParcelle(identifiant: string): Promise<EnrichissementOutputDto> {
    try {
      // Validation côté client
      if (!identifiant) {
        throw new ApiError("L'identifiant de parcelle est requis", 400, "Bad Request");
      }

      // Validation du format (même regex que côté API)
      if (!isValidParcelId(identifiant)) {
        throw new ApiError(
          "Format d'identifiant invalide. Format attendu : code commune (5-6 caractères) + préfixe (0-3 caractères) + section (1-2 lettres majuscules) + numéro (4 chiffres). Exemples : 25056000IK0102 ou 972090000O0498",
          400,
          "Bad Request",
        );
      }

      const response = await fetch(`${this.baseUrl}${API_CONFIG.endpoints.enrichirParcelle}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifiant }),
      });

      if (!response.ok) {
        const errorInfo = await this.extractErrorMessage(response);
        throw new ApiError(errorInfo.message, errorInfo.statusCode, errorInfo.error);
      }

      return response.json() as Promise<EnrichissementOutputDto>;
    } catch (error) {
      // Si c'est une erreur réseau
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new ApiError(
          "Impossible de contacter le serveur. Vérifiez votre connexion internet.",
          503,
          "Network Error",
        );
      }

      // Si c'est déjà une ApiError, la propager
      if (error instanceof ApiError) {
        throw error;
      }

      // Autre erreur
      throw new ApiError(
        error instanceof Error ? error.message : "Une erreur inattendue est survenue",
        500,
        "Unknown Error",
      );
    }
  }

  /**
   * Calculer la mutabilité d'une parcelle
   * @param input Les données d'entrée pour le calcul
   * @param options Options de calcul (mode détaillé, etc.)
   */
  async calculerMutabilite(
    input: CalculerMutabiliteInputDto,
    options?: {
      modeDetaille?: boolean;
      sansEnrichissement?: boolean;
      integrator?: string;
      isIframe?: boolean;
    },
  ): Promise<MutabiliteOutputDto> {
    try {
      // Validation côté client
      if (!input) {
        throw new ApiError("Les données d'entrée sont requises", 400, "Bad Request");
      }

      if (!input.donneesEnrichies) {
        throw new ApiError("Les données enrichies sont requises", 400, "Bad Request");
      }

      // Validation des données complémentaires si pas en mode sansEnrichissement
      if (!options?.sansEnrichissement && !input.donneesComplementaires) {
        throw new ApiError(
          "Les données complémentaires sont requises pour le calcul complet",
          400,
          "Bad Request",
        );
      }

      const params = new URLSearchParams();

      if (options?.modeDetaille) {
        params.append("modeDetaille", "true");
      }

      if (options?.sansEnrichissement) {
        params.append("sansEnrichissement", "true");
      }

      // Utiliser les infos passées en paramètre
      if (options?.isIframe) {
        params.append("iframe", "true");
        if (options?.integrator) {
          params.append("integrateur", options.integrator);
        }
      }

      // URL finale avec query params
      const finalUrl = params.toString()
        ? `${this.baseUrl}${API_CONFIG.endpoints.calculerMutabilite}?${params.toString()}`
        : `${this.baseUrl}${API_CONFIG.endpoints.calculerMutabilite}`;

      const response = await fetch(finalUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorInfo = await this.extractErrorMessage(response);
        throw new ApiError(errorInfo.message, errorInfo.statusCode, errorInfo.error);
      }

      return response.json() as Promise<MutabiliteOutputDto>;
    } catch (error) {
      // Si c'est une erreur réseau
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new ApiError(
          "Impossible de contacter le serveur. Vérifiez votre connexion internet.",
          503,
          "Network Error",
        );
      }

      // Si c'est déjà une ApiError, la propager
      if (error instanceof ApiError) {
        throw error;
      }

      // Autre erreur
      throw new ApiError(
        error instanceof Error ? error.message : "Une erreur inattendue est survenue",
        500,
        "Unknown Error",
      );
    }
  }

  /**
   * Méthode helper qui utilise le mapper externe
   */
  buildMutabiliteInput(
    enrichmentData: EnrichissementOutputDto,
    manualData: Record<string, string>,
  ): CalculerMutabiliteInputDto {
    return buildMutabilityInput(enrichmentData, manualData);
  }

  /**
   * Méthode utilitaire pour déterminer si une erreur est liée au réseau
   */
  isNetworkError(error: unknown): boolean {
    return (
      error instanceof TypeError &&
      (error.message === "Failed to fetch" || error.message.includes("network"))
    );
  }

  /**
   * Méthode utilitaire pour obtenir des suggestions selon le type d'erreur
   */
  getErrorSuggestions(error: ApiError): string[] {
    const suggestions: string[] = [];

    if (error.statusCode === 404 || error.message.toLowerCase().includes("introuvable")) {
      suggestions.push(
        "Vérifiez que l'identifiant de parcelle est correct",
        "Format attendu : code commune + section + numéro",
        "Exemple : 25056000IK0102",
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
  }
}

export const apiService = new ApiService();
