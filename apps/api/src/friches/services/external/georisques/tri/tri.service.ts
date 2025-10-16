import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ApiResponse } from "../../shared/api-response.types";
import {
  TriApiResponse,
  TriResultNormalized,
  TriSearchParams,
  TriNormalized,
  TriItem,
} from "./tri.types";
import {
  GEORISQUES_API_BASE_URL,
  GEORISQUES_ENDPOINTS,
  GEORISQUES_SOURCES,
  GEORISQUES_TIMEOUT_MS,
} from "../georisques.constants";

@Injectable()
export class TriService {
  private readonly logger = new Logger(TriService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.GEORISQUES_API_URL || GEORISQUES_API_BASE_URL;
  }

  /**
   * Récupère les TRI (Territoires à Risques importants d'Inondation) pour une localisation
   */
  async getTri(params: TriSearchParams): Promise<ApiResponse<TriResultNormalized>> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}${GEORISQUES_ENDPOINTS.TRI_ZONAGE}`;
      const latlon = `${params.longitude},${params.latitude}`;

      this.logger.debug(`Appel API TRI Zonage: ${url}?latlon=${latlon}`);

      const response = await firstValueFrom(
        this.httpService.get<TriApiResponse>(url, {
          params: { latlon },
          timeout: GEORISQUES_TIMEOUT_MS,
        }),
      );

      const data = response.data;

      // Gérer les réponses vides (pas de TRI)
      if (!data || !data.data || data.data.length === 0) {
        this.logger.log(
          `Aucun TRI pour lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)}`,
        );

        const normalized: TriResultNormalized = {
          exposition: false,
          nombreTri: 0,
          tri: [],
          typesInondation: [],
          coursEau: [],
          source: GEORISQUES_SOURCES.TRI_ZONAGE,
          dateRecuperation: new Date().toISOString(),
        };

        return {
          success: true,
          data: normalized,
          source: GEORISQUES_SOURCES.TRI_ZONAGE,
          responseTimeMs: Date.now() - startTime,
        };
      }

      // Normalisation des données
      const normalized = this.normalizeTriData(data);

      const responseTimeMs = Date.now() - startTime;

      this.logger.log(
        `TRI: lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)} → ` +
          `${normalized.nombreTri} TRI, types: ${normalized.typesInondation.join(", ")}`,
      );

      return {
        success: true,
        data: normalized,
        source: GEORISQUES_SOURCES.TRI_ZONAGE,
        responseTimeMs,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";

      this.logger.error(
        `Erreur API TRI pour lat=${params.latitude}, lon=${params.longitude}: ${errorMessage}`,
        (error as Error).stack,
      );

      return {
        success: false,
        error: errorMessage,
        source: GEORISQUES_SOURCES.TRI_ZONAGE,
        responseTimeMs,
      };
    }
  }

  /**
   * Normalise les données brutes de l'API TRI
   */
  private normalizeTriData(data: TriApiResponse): TriResultNormalized {
    const items = data.data || [];

    // Normaliser chaque TRI
    const triNormalises = items.map((item) => this.normalizeTri(item));

    // Extraire les types d'inondation uniques
    const typesInondation = [
      ...new Set(items.map((item) => item.typeInondation?.libelle || "Inconnu")),
    ];

    // Extraire les cours d'eau uniques
    const coursEau = [...new Set(items.map((item) => item.cours_deau).filter((c) => c))];

    return {
      exposition: items.length > 0,
      nombreTri: items.length,
      tri: triNormalises,
      typesInondation,
      coursEau,
      source: GEORISQUES_SOURCES.TRI_ZONAGE,
      dateRecuperation: new Date().toISOString(),
    };
  }

  /**
   * Normalise un TRI individuel
   */
  private normalizeTri(item: TriItem): TriNormalized {
    return {
      codeNational: item.code_national_tri,
      identifiant: item.identifiant_tri,
      libelle: item.libelle_tri,
      coursEau: item.cours_deau || "Non renseigné",
      typeInondation: item.typeInondation?.libelle || "Inconnu",
      scenario: item.scenario?.libelle || "Non renseigné",
    };
  }
}
