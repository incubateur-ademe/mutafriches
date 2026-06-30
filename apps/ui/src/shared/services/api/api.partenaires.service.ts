import type {
  PartenaireOutputDto,
  PartenaireSiteOutputDto,
  RenommerSitePartenaireInputDto,
} from "@mutafriches/shared-types";
import { apiClient } from "./api.client";
import { API_CONFIG } from "./api.config";

class PartenairesService {
  /** Récupère un partenaire et ses sites depuis la base. */
  async getPartenaire(slug: string): Promise<PartenaireOutputDto> {
    return apiClient.get<PartenaireOutputDto>(API_CONFIG.endpoints.partenaires.get(slug));
  }

  /** Renomme un site (nom vide => repli sur le nom par défaut). */
  async renommerSite(slug: string, id: string, nom: string): Promise<PartenaireSiteOutputDto> {
    const body: RenommerSitePartenaireInputDto = { nom };
    return apiClient.patch<PartenaireSiteOutputDto>(
      API_CONFIG.endpoints.partenaires.renommerSite(slug, id),
      body,
    );
  }
}

export const partenairesService = new PartenairesService();
