import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ApiResponse } from "../../shared/api-response.types";
import {
  RgaApiResponse,
  RgaResultNormalized,
  RgaSearchParams,
  RGA_CODE_TO_ALEA,
  RgaCodeExposition,
} from "./rga.types";
import {
  GEORISQUES_API_BASE_URL,
  GEORISQUES_ENDPOINTS,
  GEORISQUES_SOURCES,
  GEORISQUES_TIMEOUT_MS,
} from "../georisques.constants";

@Injectable()
export class RgaService {
  private readonly logger = new Logger(RgaService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.GEORISQUES_API_URL || GEORISQUES_API_BASE_URL;
  }

  /**
   * Récupère les données de retrait-gonflement des argiles pour une localisation
   */
  async getRga(params: RgaSearchParams): Promise<ApiResponse<RgaResultNormalized>> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}${GEORISQUES_ENDPOINTS.RGA}`;
      const latlon = `${params.longitude},${params.latitude}`;

      this.logger.debug(`Appel API RGA: ${url}?latlon=${latlon}`);

      const response = await firstValueFrom(
        this.httpService.get<RgaApiResponse>(url, {
          params: { latlon },
          timeout: GEORISQUES_TIMEOUT_MS,
        }),
      );

      const data = response.data;

      // ← MODIFICATION : Gérer les réponses vides (hors zone RGA)
      if (!data || Object.keys(data).length === 0 || !data.codeExposition) {
        this.logger.log(
          `Parcelle hors zone RGA (lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)})`,
        );

        // Retourner un résultat "Nul" au lieu d'une erreur
        const normalized: RgaResultNormalized = {
          alea: "Nul",
          codeExposition: "0",
          libelle: "Hors zone RGA",
          exposition: false,
          source: GEORISQUES_SOURCES.RGA,
          dateRecuperation: new Date().toISOString(),
        };

        return {
          success: true, // ← Succès car l'API a répondu correctement
          data: normalized,
          source: GEORISQUES_SOURCES.RGA,
          responseTimeMs: Date.now() - startTime,
        };
      }

      // Normalisation des données (cas normal avec données)
      const normalized = this.normalizeRgaData(data);

      const responseTimeMs = Date.now() - startTime;

      this.logger.log(
        `RGA: lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)} → ` +
          `Aléa=${normalized.alea} (code=${normalized.codeExposition})`,
      );

      return {
        success: true,
        data: normalized,
        source: GEORISQUES_SOURCES.RGA,
        responseTimeMs,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";

      this.logger.error(
        `Erreur API RGA pour lat=${params.latitude}, lon=${params.longitude}: ${errorMessage}`,
        (error as Error).stack,
      );

      return {
        success: false,
        error: errorMessage,
        source: GEORISQUES_SOURCES.RGA,
        responseTimeMs,
      };
    }
  }

  /**
   * Normalise les données brutes de l'API RGA
   */
  private normalizeRgaData(data: RgaApiResponse): RgaResultNormalized {
    // Cast avec validation
    const codeExposition = data.codeExposition as RgaCodeExposition;

    // Mapping code → aléa (avec fallback)
    const alea = RGA_CODE_TO_ALEA[codeExposition] || "Nul";

    // Exposition = true si aléa différent de Nul
    const exposition = alea !== "Nul";

    return {
      alea,
      codeExposition,
      libelle: data.exposition,
      exposition,
      source: GEORISQUES_SOURCES.RGA,
      dateRecuperation: new Date().toISOString(),
    };
  }
}
