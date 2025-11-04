import type { EnrichissementOutputDto } from "@mutafriches/shared-types";
import { apiClient } from "./api.client";
import { ApiError } from "./api.types";
import { isValidParcelId } from "../../utils/parcelle.utils";
import { API_CONFIG } from "./api.config";

class EnrichissementService {
  /**
   * Enrichir une parcelle par son identifiant
   */
  async enrichirParcelle(identifiant: string): Promise<EnrichissementOutputDto> {
    if (!identifiant) {
      throw new ApiError("L'identifiant de parcelle est requis", 400, "Bad Request");
    }

    if (!isValidParcelId(identifiant)) {
      throw new ApiError("Format d'identifiant invalide", 400, "Bad Request");
    }

    return apiClient.post<EnrichissementOutputDto>(API_CONFIG.endpoints.enrichissement.enrichir, {
      identifiant,
    });
  }
}

export const enrichissementService = new EnrichissementService();
