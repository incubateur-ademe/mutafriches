import type {
  CalculerMutabiliteInputDto,
  MutabiliteOutputDto,
  AlgorithmeVersionDto,
  ComparaisonMutabiliteOutputDto,
} from "@mutafriches/shared-types";
import { apiClient } from "./api.client";
import { API_CONFIG } from "./api.config";
import { ApiError } from "./api.types";
import type { CalculerMutabiliteOptions } from "./api.types";

class EvaluationService {
  /**
   * Calculer la mutabilité d'une parcelle
   */
  async calculerMutabilite(
    input: CalculerMutabiliteInputDto,
    options?: CalculerMutabiliteOptions,
  ): Promise<MutabiliteOutputDto> {
    if (!input) {
      throw new ApiError("Les données d'entrée sont requises", 400, "Bad Request");
    }

    if (!input.donneesEnrichies) {
      throw new ApiError("Les données enrichies sont requises", 400, "Bad Request");
    }

    if (!options?.sansEnrichissement && !input.donneesComplementaires) {
      throw new ApiError("Les données complémentaires sont requises", 400, "Bad Request");
    }

    const params: Record<string, string> = {};

    if (options?.modeDetaille) {
      params.modeDetaille = "true";
    }

    if (options?.sansEnrichissement) {
      params.sansEnrichissement = "true";
    }

    if (options?.versionAlgorithme) {
      params.versionAlgorithme = options.versionAlgorithme;
    }

    if (options?.isIframe) {
      params.iframe = "true";
      if (options?.integrator) {
        params.integrateur = options.integrator;
      }
    }

    return apiClient.post<MutabiliteOutputDto>(API_CONFIG.endpoints.evaluation.calculer, input, {
      params,
    });
  }

  /**
   * Récupérer les versions disponibles de l'algorithme
   */
  async getAlgorithmeVersions(): Promise<AlgorithmeVersionDto[]> {
    return apiClient.get<AlgorithmeVersionDto[]>(
      API_CONFIG.endpoints.evaluation.algorithmeVersions,
    );
  }

  /**
   * Comparer les résultats entre plusieurs versions de l'algorithme
   */
  async comparerMutabilite(
    input: CalculerMutabiliteInputDto,
    versions: string[],
  ): Promise<ComparaisonMutabiliteOutputDto> {
    if (!input || !input.donneesEnrichies) {
      throw new ApiError("Les données d'entrée sont requises", 400, "Bad Request");
    }

    const params: Record<string, string> = {
      versions: versions.join(","),
    };

    return apiClient.post<ComparaisonMutabiliteOutputDto>(
      API_CONFIG.endpoints.evaluation.comparer,
      input,
      { params },
    );
  }
}

export const evaluationService = new EvaluationService();
