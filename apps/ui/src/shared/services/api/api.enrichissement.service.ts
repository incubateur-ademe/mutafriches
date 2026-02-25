import {
  isValidParcelId,
  normalizeParcelId,
  type EnrichissementOutputDto,
} from "@mutafriches/shared-types";
import { apiClient } from "./api.client";
import { ApiError } from "./api.types";
import { API_CONFIG } from "./api.config";

class EnrichissementService {
  /**
   * Enrichir un site (mono ou multi-parcelle)
   *
   * Si un seul identifiant : envoi en format mono-parcelle (rétro-compatible)
   * Si plusieurs identifiants : envoi en format multi-parcelle
   */
  async enrichirSite(identifiants: string[]): Promise<EnrichissementOutputDto> {
    if (identifiants.length === 0) {
      throw new ApiError("Au moins un identifiant de parcelle est requis", 400, "Bad Request");
    }

    // Valider et normaliser chaque identifiant
    const normalizedIdentifiants = identifiants.map((identifiant) => {
      if (!isValidParcelId(identifiant)) {
        throw new ApiError(
          `Format d'identifiant parcellaire invalide : ${identifiant}. ` +
            "Format attendu : département + commune + préfixe + section + numéro. " +
            "Exemples : 070190000B2188, 75113000DL0052, 972090000O0498",
          400,
          "Bad Request",
        );
      }

      return normalizeParcelId(identifiant);
    });

    // Mono-parcelle : format rétro-compatible
    if (normalizedIdentifiants.length === 1) {
      return apiClient.post<EnrichissementOutputDto>(API_CONFIG.endpoints.enrichissement.enrichir, {
        identifiant: normalizedIdentifiants[0],
      });
    }

    // Multi-parcelle : nouveau format
    return apiClient.post<EnrichissementOutputDto>(API_CONFIG.endpoints.enrichissement.enrichir, {
      identifiants: normalizedIdentifiants,
    });
  }

  /**
   * @deprecated Utiliser enrichirSite() à la place
   * Enrichir une parcelle par son identifiant (rétro-compatible)
   */
  async enrichirParcelle(identifiant: string): Promise<EnrichissementOutputDto> {
    return this.enrichirSite([identifiant]);
  }
}

export const enrichissementService = new EnrichissementService();
