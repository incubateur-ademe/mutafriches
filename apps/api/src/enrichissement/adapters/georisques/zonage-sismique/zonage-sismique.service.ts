import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ApiResponse } from "../../shared/api-response.types";
import {
  ZonageSismiqueApiResponse,
  ZonageSismiqueResultNormalized,
  ZonageSismiqueSearchParams,
  ZoneSismicite,
  ZONAGE_SISMIQUE_LIBELLES,
} from "./zonage-sismique.types";
import {
  GEORISQUES_API_BASE_URL,
  GEORISQUES_ENDPOINTS,
  GEORISQUES_SOURCES,
  GEORISQUES_TIMEOUT_MS,
} from "../georisques.constants";

@Injectable()
export class ZonageSismiqueService {
  private readonly logger = new Logger(ZonageSismiqueService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.GEORISQUES_API_URL || GEORISQUES_API_BASE_URL;
  }

  /**
   * Récupère le zonage sismique pour une localisation
   */
  async getZonageSismique(
    params: ZonageSismiqueSearchParams,
  ): Promise<ApiResponse<ZonageSismiqueResultNormalized>> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}${GEORISQUES_ENDPOINTS.ZONAGE_SISMIQUE}`;
      const latlon = `${params.longitude},${params.latitude}`;

      this.logger.debug(`Appel API Zonage Sismique: ${url}?latlon=${latlon}`);

      const response = await firstValueFrom(
        this.httpService.get<ZonageSismiqueApiResponse>(url, {
          params: { latlon },
          timeout: GEORISQUES_TIMEOUT_MS,
        }),
      );

      const data = response.data;

      // Gérer les réponses vides
      if (!data || !data.data || data.data.length === 0) {
        this.logger.warn(
          `Aucun zonage sismique pour lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)}`,
        );

        return {
          success: false,
          error: "Aucun zonage sismique trouvé pour cette localisation",
          source: GEORISQUES_SOURCES.ZONAGE_SISMIQUE,
          responseTimeMs: Date.now() - startTime,
        };
      }

      // Normalisation des données (prendre le premier résultat)
      const item = data.data[0];
      const normalized = this.normalizeZonageSismique(item);

      const responseTimeMs = Date.now() - startTime;

      this.logger.log(
        `Zonage Sismique: lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)} → ` +
          `Zone ${normalized.codeZone} (${normalized.libelle})`,
      );

      return {
        success: true,
        data: normalized,
        source: GEORISQUES_SOURCES.ZONAGE_SISMIQUE,
        responseTimeMs,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";

      this.logger.error(
        `Erreur API Zonage Sismique pour lat=${params.latitude}, lon=${params.longitude}: ${errorMessage}`,
        (error as Error).stack,
      );

      return {
        success: false,
        error: errorMessage,
        source: GEORISQUES_SOURCES.ZONAGE_SISMIQUE,
        responseTimeMs,
      };
    }
  }

  /**
   * Normalise les données brutes de l'API Zonage Sismique
   */
  private normalizeZonageSismique(item: any): ZonageSismiqueResultNormalized {
    const codeZone = item.code_zone as ZoneSismicite;
    const libelle = item.zone_sismicite || ZONAGE_SISMIQUE_LIBELLES[codeZone] || "Inconnu";

    // Zone 1 = Très faible = pas d'exposition significative
    const exposition = parseInt(codeZone, 10) > 1;

    return {
      exposition,
      codeZone,
      libelle,
      commune: item.libelle_commune as string,
      codeInsee: item.code_insee as string,
      source: GEORISQUES_SOURCES.ZONAGE_SISMIQUE,
      dateRecuperation: new Date().toISOString(),
    };
  }
}
