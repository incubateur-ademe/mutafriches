import {
  EnrichissementOutputDto,
  CalculerMutabiliteInputDto,
  MutabiliteOutputDto,
} from "@mutafriches/shared-types";
import { API_CONFIG } from "./api.config";
import { buildMutabilityInput } from "../../utils/mappers/mutability.mapper";

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
  }

  /**
   * Enrichir une parcelle par son identifiant
   */
  async enrichirParcelle(identifiant: string): Promise<EnrichissementOutputDto> {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.endpoints.enrichirParcelle}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifiant }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erreur lors de l'enrichissement: ${error}`);
    }

    return response.json() as Promise<EnrichissementOutputDto>;
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
    },
  ): Promise<MutabiliteOutputDto> {
    const queryParams = new URLSearchParams();

    if (options?.modeDetaille) {
      queryParams.append("modeDetaille", "true");
    }

    if (options?.sansEnrichissement) {
      queryParams.append("sansEnrichissement", "true");
    }

    const response = await fetch(
      `${this.baseUrl}${API_CONFIG.endpoints.calculerMutabilite}${queryParams.toString() ? "?" + queryParams.toString() : ""}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erreur lors du calcul de mutabilité: ${error}`);
    }

    return response.json() as Promise<MutabiliteOutputDto>;
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
}

export const apiService = new ApiService();
