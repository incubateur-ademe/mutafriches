import type { SitesEvalues } from "@mutafriches/shared-types";
import { apiClient } from "./api.client";
import { API_CONFIG } from "./api.config";

class StatsService {
  // Sites distincts analysés, hors cache et démonstration
  async getSitesEvalues(): Promise<number> {
    const reponse = await apiClient.get<SitesEvalues>(API_CONFIG.endpoints.stats.sitesEvalues);
    return reponse.nombre;
  }
}

export const statsService = new StatsService();
