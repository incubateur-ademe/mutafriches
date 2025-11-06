import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ApiResponse } from "../../shared/api-response.types";
import {
  SisApiResponse,
  SisResultNormalized,
  SisSearchByInseeParams,
  SisSearchByLatLonParams,
  SisSummary,
} from "./sis.types";
import {
  GEORISQUES_API_BASE_URL,
  GEORISQUES_ENDPOINTS,
  GEORISQUES_SOURCES,
  GEORISQUES_TIMEOUT_MS,
  GEORISQUES_RAYONS_DEFAUT,
  GEORISQUES_NOMBRE_RESULTATS_RECENTS,
} from "../georisques.constants";

@Injectable()
export class SisService {
  private readonly logger = new Logger(SisService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.GEORISQUES_API_URL || GEORISQUES_API_BASE_URL;
  }

  /**
   * Récupère les SIS par code INSEE
   */
  async getSisByCodeInsee(
    params: SisSearchByInseeParams,
  ): Promise<ApiResponse<SisResultNormalized>> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}${GEORISQUES_ENDPOINTS.SIS}`;
      const pageSize = params.pageSize || 100;

      this.logger.debug(`Appel API SIS par code INSEE: ${url}?code_insee=${params.codeInsee}`);

      const response = await firstValueFrom(
        this.httpService.get<SisApiResponse>(url, {
          params: {
            code_insee: params.codeInsee,
            page_size: pageSize,
          },
          timeout: GEORISQUES_TIMEOUT_MS,
        }),
      );

      const data = response.data;

      // Normalisation des données
      const normalized = this.normalizeSisData(data);

      const responseTimeMs = Date.now() - startTime;

      this.logger.log(`SIS (INSEE ${params.codeInsee}): ${normalized.nombreSis} SIS trouvés`);

      return {
        success: true,
        data: normalized,
        source: GEORISQUES_SOURCES.SIS,
        responseTimeMs,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";

      this.logger.error(
        `Erreur API SIS pour INSEE ${params.codeInsee}: ${errorMessage}`,
        (error as Error).stack,
      );

      return {
        success: false,
        error: errorMessage,
        source: GEORISQUES_SOURCES.SIS,
        responseTimeMs,
      };
    }
  }

  /**
   * Récupère les SIS par coordonnées géographiques
   */
  async getSisByLatLon(params: SisSearchByLatLonParams): Promise<ApiResponse<SisResultNormalized>> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}${GEORISQUES_ENDPOINTS.SIS}`;
      const latlon = `${params.longitude},${params.latitude}`;
      const rayon = params.rayon || GEORISQUES_RAYONS_DEFAUT.SIS;
      const pageSize = params.pageSize || 100;

      this.logger.debug(`Appel API SIS par latlon: ${url}?latlon=${latlon}&rayon=${rayon}`);

      const response = await firstValueFrom(
        this.httpService.get<SisApiResponse>(url, {
          params: {
            latlon,
            rayon,
            page_size: pageSize,
          },
          timeout: GEORISQUES_TIMEOUT_MS,
        }),
      );

      const data = response.data;

      // Normalisation des données
      const normalized = this.normalizeSisData(data);

      const responseTimeMs = Date.now() - startTime;

      this.logger.log(
        `SIS (lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)}, rayon=${rayon}m): ` +
          `${normalized.nombreSis} SIS trouvés`,
      );

      return {
        success: true,
        data: normalized,
        source: GEORISQUES_SOURCES.SIS,
        responseTimeMs,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";

      this.logger.error(
        `Erreur API SIS pour lat=${params.latitude}, lon=${params.longitude}: ${errorMessage}`,
        (error as Error).stack,
      );

      return {
        success: false,
        error: errorMessage,
        source: GEORISQUES_SOURCES.SIS,
        responseTimeMs,
      };
    }
  }

  /**
   * Normalise les données brutes de l'API SIS
   */
  private normalizeSisData(data: SisApiResponse): SisResultNormalized {
    const presenceSis = data.results > 0;
    const nombreSis = data.results;

    // Limiter aux N premiers résultats les plus pertinents
    const sisLimites = data.data.slice(0, GEORISQUES_NOMBRE_RESULTATS_RECENTS.SIS);

    const sisProches: SisSummary[] = sisLimites.map((sis) => ({
      id: sis.id_sis,
      nom: sis.nom,
      adresse: sis.adresse || sis.adresse_lieudit,
      superficie: sis.superficie,
      commune: sis.nom_commune,
      statutClassification: sis.statut_classification,
      ficheRisque: sis.fiche_risque,
      dateMaj: sis.date_maj,
    }));

    return {
      presenceSis,
      nombreSis,
      sisProches,
      source: GEORISQUES_SOURCES.SIS,
      dateRecuperation: new Date().toISOString(),
    };
  }
}
