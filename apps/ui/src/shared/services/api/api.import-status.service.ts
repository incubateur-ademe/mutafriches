import type { ImportStatusOutput } from "@mutafriches/shared-types";
import { apiClient } from "./api.client";
import { API_CONFIG } from "./api.config";

class ImportStatusService {
  async getStatus(): Promise<ImportStatusOutput> {
    return apiClient.get<ImportStatusOutput>(API_CONFIG.endpoints.importStatus.lister);
  }
}

export const importStatusService = new ImportStatusService();
