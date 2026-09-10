import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { firstValueFrom } from "rxjs";
import { ApiResponse } from "../shared/api-response.types";
import { FCU_API_BASE_URL, FCU_TIMEOUT_MS } from "./france-chaleur-urbaine.constants";
import { FranceChaleurUrbaineEligibiliteResponse } from "./france-chaleur-urbaine.types";

/**
 * Client de l'API France Chaleur Urbaine (ministère de la Transition écologique).
 *
 * Endpoint public, sans authentification : le jeton Bearer ne concerne que l'API partenaire
 * `/v2/demands`, hors périmètre ici.
 */
@Injectable()
export class FranceChaleurUrbaineService {
  private readonly logger = new Logger(FranceChaleurUrbaineService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Teste la proximité d'un réseau de chaleur pour un point géographique (EPSG:4326).
   */
  async getEligibilite(
    latitude: number,
    longitude: number,
  ): Promise<ApiResponse<FranceChaleurUrbaineEligibiliteResponse>> {
    const startTime = Date.now();

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${FCU_API_BASE_URL}/v1/eligibility`, {
          params: { lat: latitude, lon: longitude },
          timeout: FCU_TIMEOUT_MS,
        }),
      );

      const data = response.data as FranceChaleurUrbaineEligibiliteResponse;

      return {
        success: true,
        data,
        source: SourceEnrichissement.FRANCE_CHALEUR_URBAINE,
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Erreur API France Chaleur Urbaine : ${err.message}`);
      return {
        success: false,
        error: err.message,
        source: SourceEnrichissement.FRANCE_CHALEUR_URBAINE,
        responseTimeMs: Date.now() - startTime,
      };
    }
  }
}
