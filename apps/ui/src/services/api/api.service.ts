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
      integrator?: string;
      isIframe?: boolean;
    },
  ): Promise<MutabiliteOutputDto> {
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
