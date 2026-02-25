import { apiClient } from "./api.client";
import { API_CONFIG } from "./api.config";

interface MetabaseEmbedResponse {
  iframeUrl: string;
}

class MetabaseService {
  /**
   * Recupere l'URL d'embedding signee pour le dashboard Metabase.
   */
  async getEmbedUrl(): Promise<string> {
    const response = await apiClient.get<MetabaseEmbedResponse>(
      API_CONFIG.endpoints.metabase.embedUrl,
    );
    return response.iframeUrl;
  }
}

export const metabaseService = new MetabaseService();
