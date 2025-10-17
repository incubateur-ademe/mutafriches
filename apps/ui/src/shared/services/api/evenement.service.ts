import { EvenementInputDto } from "@mutafriches/shared-types";
import { API_CONFIG } from "./api.config";

class EvenementService {
  private sessionId: string;

  constructor() {
    this.sessionId = this.genererSessionId();
  }

  async enregistrerEvenement(
    input: Omit<EvenementInputDto, "sessionId">,
    options?: {
      isIframe?: boolean;
      integrator?: string;
    },
  ): Promise<void> {
    try {
      const params = new URLSearchParams();
      if (options?.isIframe) params.append("iframe", "true");
      if (options?.integrator) params.append("integrateur", options.integrator);

      const url = `${API_CONFIG.baseUrl}/evenements${params.toString() ? `?${params}` : ""}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...input,
          sessionId: this.sessionId,
        }),
      });

      if (!response.ok) {
        console.error("Erreur enregistrement evenement:", response.status);
      }
    } catch (error) {
      console.error("Erreur tracking evenement:", error);
    }
  }

  private genererSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const evenementService = new EvenementService();
