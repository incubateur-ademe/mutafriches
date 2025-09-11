import {
  EnrichmentResultDto,
  MutabilityInputDto,
  MutabilityResultDto,
} from "@mutafriches/shared-types";
import { API_CONFIG } from "./api.config";
import { buildMutabilityInput } from "../mappers/mutability.mapper";

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
  }

  /**
   * Enrichir une parcelle par son identifiant
   */
  async enrichirParcelle(identifiantParcelle: string): Promise<EnrichmentResultDto> {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.endpoints.enrichirParcelle}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifiantParcelle }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erreur lors de l'enrichissement: ${error}`);
    }

    return response.json() as Promise<EnrichmentResultDto>;
  }

  /**
   * Calculer la mutabilité d'une parcelle
   */
  async calculerMutabilite(input: MutabilityInputDto): Promise<MutabilityResultDto> {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.endpoints.calculerMutabilite}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erreur lors du calcul de mutabilité: ${error}`);
    }

    return response.json() as Promise<MutabilityResultDto>;
  }

  /**
   * Méthode helper qui utilise le mapper externe
   */
  buildMutabilityInput(
    enrichmentData: EnrichmentResultDto,
    manualData: Record<string, string>,
  ): MutabilityInputDto {
    return buildMutabilityInput(enrichmentData, manualData);
  }
}

export const apiService = new ApiService();
