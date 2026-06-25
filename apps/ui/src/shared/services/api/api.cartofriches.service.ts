import type { CartofrichesRechercheResult } from "@mutafriches/shared-types";
import { apiClient } from "./api.client";
import { API_CONFIG } from "./api.config";

/**
 * Service d'accès aux données Cartofriches (via le proxy backend Mutafriches).
 * Utilisé par la page de comparaison Mutafriches / Cartofriches (section Tests).
 */
class CartofrichesService {
  /**
   * Recherche la friche Cartofriches correspondant à un identifiant cadastral.
   */
  async rechercher(identifiant: string, codeInsee: string): Promise<CartofrichesRechercheResult> {
    return apiClient.get<CartofrichesRechercheResult>(API_CONFIG.endpoints.cartofriches.recherche, {
      params: { identifiant, codeInsee },
    });
  }
}

export const cartofrichesService = new CartofrichesService();
