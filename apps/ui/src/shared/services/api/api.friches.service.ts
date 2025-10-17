import type {
  EnrichissementOutputDto,
  CalculerMutabiliteInputDto,
  MutabiliteOutputDto,
} from "@mutafriches/shared-types";
import { apiClient } from "./api.client";
import { API_CONFIG } from "./api.config";
import { ApiError } from "./api.types";
import type { CalculerMutabiliteOptions } from "./api.types";
import { isValidParcelId } from "../../utils/parcelle.utils";

class FrichesService {
  /**
   * Enrichir une parcelle par son identifiant
   */
  async enrichirParcelle(identifiant: string): Promise<EnrichissementOutputDto> {
    // Validation côté client
    if (!identifiant) {
      throw new ApiError("L'identifiant de parcelle est requis", 400, "Bad Request");
    }

    if (!isValidParcelId(identifiant)) {
      throw new ApiError(
        "Format d'identifiant invalide. Format attendu : code commune (5-6 caractères) + préfixe (0-3 caractères) + section (1-2 lettres majuscules) + numéro (4 chiffres). Exemples : 25056000IK0102 ou 972090000O0498",
        400,
        "Bad Request",
      );
    }

    return apiClient.post<EnrichissementOutputDto>(API_CONFIG.endpoints.friches.enrichir, {
      identifiant,
    });
  }

  /**
   * Calculer la mutabilité d'une parcelle
   */
  async calculerMutabilite(
    input: CalculerMutabiliteInputDto,
    options?: CalculerMutabiliteOptions,
  ): Promise<MutabiliteOutputDto> {
    // Validation côté client
    if (!input) {
      throw new ApiError("Les données d'entrée sont requises", 400, "Bad Request");
    }

    if (!input.donneesEnrichies) {
      throw new ApiError("Les données enrichies sont requises", 400, "Bad Request");
    }

    if (!options?.sansEnrichissement && !input.donneesComplementaires) {
      throw new ApiError(
        "Les données complémentaires sont requises pour le calcul complet",
        400,
        "Bad Request",
      );
    }

    // Construire les query params
    const params: Record<string, string> = {};

    if (options?.modeDetaille) {
      params.modeDetaille = "true";
    }

    if (options?.sansEnrichissement) {
      params.sansEnrichissement = "true";
    }

    if (options?.isIframe) {
      params.iframe = "true";
      if (options?.integrator) {
        params.integrateur = options.integrator;
      }
    }

    return apiClient.post<MutabiliteOutputDto>(API_CONFIG.endpoints.friches.calculer, input, {
      params,
    });
  }
}

export const frichesService = new FrichesService();
