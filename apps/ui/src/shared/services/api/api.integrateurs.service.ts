import type {
  DeclarationIntegrateurInput,
  DeclarationIntegrateurOutput,
} from "@mutafriches/shared-types";
import { apiClient } from "./api.client";
import { API_CONFIG } from "./api.config";

class IntegrateursService {
  /** Déclare une utilisation de Mutafriches (API, page personnalisée, iframe). */
  async declarer(declaration: DeclarationIntegrateurInput): Promise<DeclarationIntegrateurOutput> {
    return apiClient.post<DeclarationIntegrateurOutput>(
      API_CONFIG.endpoints.integrateurs.declarer,
      declaration,
    );
  }
}

export const integrateursService = new IntegrateursService();
