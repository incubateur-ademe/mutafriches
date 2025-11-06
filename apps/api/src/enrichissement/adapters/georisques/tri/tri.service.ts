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
      const url = `${this.baseUrl}${GEORISQUES_ENDPOINTS.TRI}`;
      const latlon = `${params.longitude},${params.latitude}`;
      const rayon = params.rayon || 1000; // Rayon par défaut de 1000m

      this.logger.debug(`Appel API TRI: ${url}?latlon=${latlon}&rayon=${rayon}`);

      const response = await firstValueFrom(
        this.httpService.get<TriApiResponse>(url, {
          params: {
            latlon,
            rayon,
          },
          timeout: GEORISQUES_TIMEOUT_MS,
        }),
      );

      const data = response.data;

      // Gérer les réponses vides (pas de TRI)
      if (!data || !data.data || data.data.length === 0) {
        this.logger.log(
          `Aucun TRI pour lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)}, rayon=${rayon}m`,
        );

        const normalized: TriResultNormalized = {
          exposition: false,
          nombreTri: 0,
          tri: [],
          risquesUniques: [],
          communesConcernees: [],
          source: GEORISQUES_SOURCES.TRI,
          dateRecuperation: new Date().toISOString(),
        };

        return {
          success: true,
          data: normalized,
          source: GEORISQUES_SOURCES.TRI,
          responseTimeMs: Date.now() - startTime,
        };
      }

      // Normalisation des données
      const normalized = this.normalizeTriData(data);

      const responseTimeMs = Date.now() - startTime;

      this.logger.log(
        `TRI: lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)} → ` +
          `${normalized.nombreTri} TRI, risques: ${normalized.risquesUniques.slice(0, 3).join(", ")}${normalized.risquesUniques.length > 3 ? "..." : ""}`,
      );

      return {
        success: true,
        data: normalized,
        source: GEORISQUES_SOURCES.TRI,
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
        source: GEORISQUES_SOURCES.TRI,
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

    // Extraire les risques uniques
    const risquesUniques = [
      ...new Set(
        items.flatMap((item) =>
          (item.liste_libelle_risque || []).map((r) => r.libelle_risque_long),
        ),
      ),
    ];

    // Extraire les communes concernées
    const communesConcernees = [...new Set(items.map((item) => item.libelle_commune))];

    return {
      exposition: items.length > 0,
      nombreTri: items.length,
      tri: triNormalises,
      risquesUniques,
      communesConcernees,
      source: GEORISQUES_SOURCES.TRI,
      dateRecuperation: new Date().toISOString(),
    };
  }

  /**
   * Normalise un TRI individuel
   */
  private normalizeTri(item: TriItem): TriNormalized {
    return {
      codeNational: item.code_national_tri,
      libelle: item.libelle_tri,
      risques: (item.liste_libelle_risque || []).map((r) => r.libelle_risque_long),
      bassinRisques: item.libelle_bassin_risques || "Non renseigné",
      codeInsee: item.code_insee,
      commune: item.libelle_commune,
      dateArreteApprobation: item.date_arrete_approbation || null,
    };
  }
}
