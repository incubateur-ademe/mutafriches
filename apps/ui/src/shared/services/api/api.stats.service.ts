import type { StatOutput } from "@mutafriches/shared-types";
import { apiClient } from "./api.client";
import { API_CONFIG } from "./api.config";

class StatsService {
  // Nombre total d'analyses abouties, toutes périodes confondues
  async getTotalAnalysesAbouties(): Promise<number> {
    const stat = await apiClient.get<StatOutput>(API_CONFIG.endpoints.stats.analysesAbouties);
    return stat.stats.reduce((total, point) => total + point.value, 0);
  }
}

export const statsService = new StatsService();
