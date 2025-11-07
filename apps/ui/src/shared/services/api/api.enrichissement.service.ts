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
   * Enrichir une parcelle par son identifiant
   * Normalise automatiquement l'IDU avant envoi à l'API
   */
  async enrichirParcelle(identifiant: string): Promise<EnrichissementOutputDto> {
    if (!identifiant) {
      throw new ApiError("L'identifiant de parcelle est requis", 400, "Bad Request");
    }

    // Valider l'IDU brut
    if (!isValidParcelId(identifiant)) {
      throw new ApiError(
        "Format d'identifiant parcellaire invalide. " +
          "Format attendu : département + commune + préfixe + section + numéro. " +
          "Exemples : 070190000B2188, 75113000DL0052, 972090000O0498",
        400,
        "Bad Request",
      );
    }

    // Normaliser l'IDU (retire les zéros préfixes dans les sections)
    const normalizedIdentifiant = normalizeParcelId(identifiant);

    if (normalizedIdentifiant !== identifiant) {
      console.debug(`IDU normalisé: ${identifiant} → ${normalizedIdentifiant}`);
    }

    return apiClient.post<EnrichissementOutputDto>(API_CONFIG.endpoints.enrichissement.enrichir, {
      identifiant: normalizedIdentifiant, // Envoyer l'IDU normalisé
    });
  }
}

export const enrichissementService = new EnrichissementService();
