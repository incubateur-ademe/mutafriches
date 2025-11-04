import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ApiResponse } from "../../shared/api-response.types";
import {
  AziApiResponse,
  AziResultNormalized,
  AziSearchParams,
  AziNormalized,
  AziItem,
} from "./azi.types";
import {
  GEORISQUES_API_BASE_URL,
  GEORISQUES_ENDPOINTS,
  GEORISQUES_SOURCES,
  GEORISQUES_TIMEOUT_MS,
} from "../georisques.constants";

@Injectable()
export class AziService {
  private readonly logger = new Logger(AziService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.GEORISQUES_API_URL || GEORISQUES_API_BASE_URL;
  }

  /**
   * Récupère les AZI (Atlas des Zones Inondables) pour une localisation
   */
  async getAzi(params: AziSearchParams): Promise<ApiResponse<AziResultNormalized>> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}${GEORISQUES_ENDPOINTS.AZI}`;
      const latlon = `${params.longitude},${params.latitude}`;
      const rayon = params.rayon || 1000; // Rayon par défaut de 1000m

      this.logger.debug(`Appel API AZI: ${url}?latlon=${latlon}&rayon=${rayon}`);

      const response = await firstValueFrom(
        this.httpService.get<AziApiResponse>(url, {
          params: {
            latlon,
            rayon,
          },
          timeout: GEORISQUES_TIMEOUT_MS,
        }),
      );

      const data = response.data;

      // Gérer les réponses vides (pas d'AZI)
      if (!data || !data.data || data.data.length === 0) {
        this.logger.log(
          `Aucun AZI pour lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)}, rayon=${rayon}m`,
        );

        const normalized: AziResultNormalized = {
          exposition: false,
          nombreAzi: 0,
          azi: [],
          risquesUniques: [],
          communesConcernees: [],
          source: GEORISQUES_SOURCES.AZI,
          dateRecuperation: new Date().toISOString(),
        };

        return {
          success: true,
          data: normalized,
          source: GEORISQUES_SOURCES.AZI,
          responseTimeMs: Date.now() - startTime,
        };
      }

      // Normalisation des données
      const normalized = this.normalizeAziData(data);

      const responseTimeMs = Date.now() - startTime;

      this.logger.log(
        `AZI: lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)} → ` +
          `${normalized.nombreAzi} AZI, risques: ${normalized.risquesUniques.slice(0, 3).join(", ")}${normalized.risquesUniques.length > 3 ? "..." : ""}`,
      );

      return {
        success: true,
        data: normalized,
        source: GEORISQUES_SOURCES.AZI,
        responseTimeMs,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";

      this.logger.error(
        `Erreur API AZI pour lat=${params.latitude}, lon=${params.longitude}: ${errorMessage}`,
        (error as Error).stack,
      );

      return {
        success: false,
        error: errorMessage,
        source: GEORISQUES_SOURCES.AZI,
        responseTimeMs,
      };
    }
  }

  /**
   * Normalise les données brutes de l'API AZI
   */
  private normalizeAziData(data: AziApiResponse): AziResultNormalized {
    const items = data.data || [];

    // Normaliser chaque AZI
    const aziNormalises = items.map((item) => this.normalizeAzi(item));

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
      nombreAzi: items.length,
      azi: aziNormalises,
      risquesUniques,
      communesConcernees,
      source: GEORISQUES_SOURCES.AZI,
      dateRecuperation: new Date().toISOString(),
    };
  }

  /**
   * Normalise un AZI individuel
   */
  private normalizeAzi(item: AziItem): AziNormalized {
    return {
      codeNational: item.code_national_azi,
      libelle: item.libelle_azi,
      risques: (item.liste_libelle_risque || []).map((r) => r.libelle_risque_long),
      bassinRisques: item.libelle_bassin_risques || "Non renseigné",
      codeInsee: item.code_insee,
      commune: item.libelle_commune,
      dateRealisation: item.date_realisation || null,
      dateDiffusion: item.date_diffusion || null,
      datePublicationWeb: item.date_publication_web || null,
    };
  }
}
