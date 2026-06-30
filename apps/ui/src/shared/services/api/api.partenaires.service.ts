import type { PartenaireOutputDto } from "@mutafriches/shared-types";
import { apiClient } from "./api.client";
import { API_CONFIG } from "./api.config";

class PartenairesService {
  /** Récupère un partenaire et ses sites depuis la base. */
  async getPartenaire(slug: string): Promise<PartenaireOutputDto> {
    return apiClient.get<PartenaireOutputDto>(API_CONFIG.endpoints.partenaires.get(slug));
  }
}

export const partenairesService = new PartenairesService();
