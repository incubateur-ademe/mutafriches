import type { EvenementInputDto } from "@mutafriches/shared-types";
import { apiClient } from "./api.client";
import { API_CONFIG } from "./api.config";
import type { ApiCallOptions } from "./api.types";
import { generateSessionId } from "./api.utils";

class EvenementsService {
  private sessionId: string;

  constructor() {
    this.sessionId = generateSessionId();
  }

  /**
   * Enregistrer un événement utilisateur
   */
  async enregistrerEvenement(
    input: Omit<EvenementInputDto, "sessionId">,
    options?: ApiCallOptions,
  ): Promise<void> {
    try {
      const params: Record<string, string> = {};

      if (options?.isIframe) {
        params.iframe = "true";
      }

      if (options?.integrator) {
        params.integrateur = options.integrator;
      }

      await apiClient.post(
        API_CONFIG.endpoints.evenements.enregistrer,
        {
          ...input,
          sessionId: this.sessionId,
        },
        { params },
      );
    } catch (error) {
      // Ne pas bloquer l'app si le tracking échoue
      console.error("Erreur tracking evenement:", error);
    }
  }

  /**
   * Obtenir l'ID de session actuel
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

export const evenementsService = new EvenementsService();
