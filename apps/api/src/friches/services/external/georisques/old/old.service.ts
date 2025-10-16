import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ApiResponse } from "../../shared/api-response.types";
import { OldApiResponse, OldResultNormalized, OldSearchParams } from "./old.types";
import {
  GEORISQUES_API_BASE_URL,
  GEORISQUES_ENDPOINTS,
  GEORISQUES_SOURCES,
  GEORISQUES_TIMEOUT_MS,
} from "../georisques.constants";

@Injectable()
export class OldService {
  private readonly logger = new Logger(OldService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.GEORISQUES_API_URL || GEORISQUES_API_BASE_URL;
  }

  /**
   * Récupère les Obligations Légales de Débroussaillement pour une localisation
   */
  async getOld(params: OldSearchParams): Promise<ApiResponse<OldResultNormalized>> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}${GEORISQUES_ENDPOINTS.OLD}`;
      const latlon = `${params.longitude},${params.latitude}`;

      this.logger.debug(`Appel API OLD: ${url}?latlon=${latlon}`);

      const response = await firstValueFrom(
        this.httpService.get<OldApiResponse>(url, {
          params: { latlon },
          timeout: GEORISQUES_TIMEOUT_MS,
        }),
      );

      const data = response.data;

      // Gérer les réponses vides (pas d'obligation)
      if (!data || !Array.isArray(data) || data.length === 0) {
        this.logger.log(
          `Aucune obligation de débroussaillement pour lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)}`,
        );

        const normalized: OldResultNormalized = {
          exposition: false,
          commune: "Non renseigné",
          codeInsee: "Non renseigné",
          source: GEORISQUES_SOURCES.OLD,
          dateRecuperation: new Date().toISOString(),
        };

        return {
          success: true,
          data: normalized,
          source: GEORISQUES_SOURCES.OLD,
          responseTimeMs: Date.now() - startTime,
        };
      }

      // Normalisation (prendre le premier résultat)
      const normalized = this.normalizeOld(data[0]);

      const responseTimeMs = Date.now() - startTime;

      this.logger.log(
        `OLD: lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)} → ` +
          `Obligation de débroussaillement pour ${normalized.commune} (${normalized.codeInsee})`,
      );

      return {
        success: true,
        data: normalized,
        source: GEORISQUES_SOURCES.OLD,
        responseTimeMs,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";

      this.logger.error(
        `Erreur API OLD pour lat=${params.latitude}, lon=${params.longitude}: ${errorMessage}`,
        (error as Error).stack,
      );

      return {
        success: false,
        error: errorMessage,
        source: GEORISQUES_SOURCES.OLD,
        responseTimeMs,
      };
    }
  }

  /**
   * Normalise les données brutes de l'API OLD
   */
  private normalizeOld(item: any): OldResultNormalized {
    return {
      exposition: true, // Si présent dans la réponse = obligation
      commune: (item.commune?.nom as string) || "Non renseigné",
      codeInsee: (item.commune?.code as string) || "Non renseigné",
      dateApprobation: item.risque?.["Date approbation"] as string,
      urlRisque: item.risque?.url as string,
      source: GEORISQUES_SOURCES.OLD,
      dateRecuperation: new Date().toISOString(),
    };
  }
}
