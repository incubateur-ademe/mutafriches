import {
  ParcelleInputDto,
  EnrichmentResultDto,
  MutabilityInputDto,
  MutabilityResultDto,
} from "@mutafriches/shared-types";

/**
 * Configuration de base pour l'API
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Classe d'erreur personnalisée pour l'API
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Helper pour gérer les réponses d'API
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({
      message: response.statusText,
    }));
    throw new ApiError(response.status, errorBody.message || response.statusText, errorBody);
  }
  return response.json() as Promise<T>;
}

/**
 * Service principal d'API
 */
export class ApiService {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.headers = {
      "Content-Type": "application/json",
    };
  }

  /**
   * Enrichir une parcelle avec les données externes
   * @param identifiantParcelle - Identifiant cadastral de la parcelle
   * @returns Données enrichies de la parcelle
   */
  async enrichirParcelle(identifiantParcelle: string): Promise<EnrichmentResultDto> {
    const input: ParcelleInputDto = { identifiantParcelle };

    const response = await fetch(`${this.baseUrl}/friches/parcelle/enrichir`, {
      method: "POST",
      headers: this.headers,
      credentials: "include", // Pour inclure les cookies de session
      body: JSON.stringify(input),
    });

    return handleResponse<EnrichmentResultDto>(response);
  }

  /**
   * Calculer la mutabilité d'une parcelle
   * @param input - Données complètes de la parcelle (enrichies + manuelles)
   * @returns Résultats de mutabilité avec indices par usage
   */
  async calculerMutabilite(input: MutabilityInputDto): Promise<MutabilityResultDto> {
    const response = await fetch(`${this.baseUrl}/friches/parcelle/mutabilite`, {
      method: "POST",
      headers: this.headers,
      credentials: "include",
      body: JSON.stringify(input),
    });

    return handleResponse<MutabilityResultDto>(response);
  }

  /**
   * Workflow complet : enrichir puis calculer la mutabilité
   * @param identifiantParcelle - Identifiant cadastral
   * @param donneesManuellesInput - Données manuelles complémentaires
   * @returns Résultats complets de mutabilité
   */
  async analyserParcelle(
    identifiantParcelle: string,
    donneesManuellesInput?: Partial<MutabilityInputDto>,
  ): Promise<{
    enrichment: EnrichmentResultDto;
    mutability: MutabilityResultDto;
  }> {
    // Étape 1: Enrichissement
    const enrichment = await this.enrichirParcelle(identifiantParcelle);

    // Étape 2: Fusion avec les données manuelles
    const mutabilityInput: MutabilityInputDto = {
      ...enrichment,
      ...donneesManuellesInput,
    } as MutabilityInputDto;

    // Étape 3: Calcul de mutabilité
    const mutability = await this.calculerMutabilite(mutabilityInput);

    return { enrichment, mutability };
  }
}

// Export d'une instance par défaut
export const apiService = new ApiService();

/**
 * Hook React pour utiliser l'API avec gestion d'état
 */
export function useApi() {
  return {
    enrichirParcelle: apiService.enrichirParcelle.bind(apiService),
    calculerMutabilite: apiService.calculerMutabilite.bind(apiService),
    analyserParcelle: apiService.analyserParcelle.bind(apiService),
  };
}
