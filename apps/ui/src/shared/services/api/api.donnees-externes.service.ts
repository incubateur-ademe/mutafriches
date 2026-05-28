import type { ApiMonitoringSnapshot, ImportStatusOutput } from "@mutafriches/shared-types";
import { apiClient } from "./api.client";
import { API_CONFIG } from "./api.config";

class DonneesExternesService {
  /**
   * Récupère le statut des imports de référentiels (table raw_imports_log +
   * COUNT actuel sur les tables cibles).
   */
  async getImports(): Promise<ImportStatusOutput> {
    return apiClient.get<ImportStatusOutput>(API_CONFIG.endpoints.donneesExternes.imports);
  }

  /**
   * Récupère le dernier snapshot du monitoring des APIs externes (résultat du
   * cron quotidien GitHub Actions). Si aucun check n'a encore été exécuté,
   * `checkedAt` vaut `null` et `apis` est vide.
   */
  async getApis(): Promise<ApiMonitoringSnapshot> {
    return apiClient.get<ApiMonitoringSnapshot>(API_CONFIG.endpoints.donneesExternes.apis);
  }
}

export const donneesExternesService = new DonneesExternesService();
