import type { VueStatistiques } from "@mutafriches/shared-types";
import { apiClient } from "./api.client";
import { API_CONFIG } from "./api.config";

interface MetabaseEmbedResponse {
  iframeUrl: string;
}

class MetabaseService {
  // URL d'embedding signée, positionnée sur l'onglet de la vue demandée
  async getEmbedUrl(vue: VueStatistiques): Promise<string> {
    const response = await apiClient.get<MetabaseEmbedResponse>(
      `${API_CONFIG.endpoints.metabase.embedUrl}?vue=${vue}`,
    );
    return response.iframeUrl;
  }
}

export const metabaseService = new MetabaseService();
