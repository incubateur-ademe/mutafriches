import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ApiResponse } from "../../shared/api-response.types";
import {
  CatnatApiResponse,
  CatnatResultNormalized,
  CatnatSearchParams,
  CatnatEventNormalized,
} from "./catnat.types";
import {
  GEORISQUES_API_BASE_URL,
  GEORISQUES_ENDPOINTS,
  GEORISQUES_SOURCES,
  GEORISQUES_TIMEOUT_MS,
  GEORISQUES_RAYONS_DEFAUT,
  GEORISQUES_NOMBRE_RESULTATS_RECENTS,
} from "../georisques.constants";

@Injectable()
export class CatnatService {
  private readonly logger = new Logger(CatnatService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.GEORISQUES_API_URL || GEORISQUES_API_BASE_URL;
  }

  /**
   * Récupère les catastrophes naturelles pour une localisation
   */
  async getCatnat(params: CatnatSearchParams): Promise<ApiResponse<CatnatResultNormalized>> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}${GEORISQUES_ENDPOINTS.CATNAT}`;
      const latlon = `${params.longitude},${params.latitude}`;
      const rayon = params.rayon || GEORISQUES_RAYONS_DEFAUT.CATNAT;

      this.logger.debug(`Appel API CATNAT: ${url}?latlon=${latlon}&rayon=${rayon}`);

      const response = await firstValueFrom(
        this.httpService.get<CatnatApiResponse>(url, {
          params: {
            latlon,
            rayon,
            page: 1,
            page_size: 100, // Récupérer jusqu'à 100 événements
          },
          timeout: GEORISQUES_TIMEOUT_MS,
        }),
      );

      const data = response.data;

      // Gérer les réponses vides (aucune catastrophe)
      if (!data || !data.data || data.data.length === 0) {
        this.logger.log(
          `Aucune catastrophe naturelle pour lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)}, rayon=${rayon}m`,
        );

        const normalized: CatnatResultNormalized = {
          nombreEvenements: 0,
          evenementsRecents: [],
          typesRisques: [],
          exposition: false,
          source: GEORISQUES_SOURCES.CATNAT,
          dateRecuperation: new Date().toISOString(),
        };

        return {
          success: true,
          data: normalized,
          source: GEORISQUES_SOURCES.CATNAT,
          responseTimeMs: Date.now() - startTime,
        };
      }

      // Normalisation des données
      const normalized = this.normalizeCatnatData(data);

      const responseTimeMs = Date.now() - startTime;

      this.logger.log(
        `CATNAT: lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)} → ` +
          `${normalized.nombreEvenements} événements, types: ${normalized.typesRisques.join(", ")}`,
      );

      return {
        success: true,
        data: normalized,
        source: GEORISQUES_SOURCES.CATNAT,
        responseTimeMs,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";

      this.logger.error(
        `Erreur API CATNAT pour lat=${params.latitude}, lon=${params.longitude}: ${errorMessage}`,
        (error as Error).stack,
      );

      return {
        success: false,
        error: errorMessage,
        source: GEORISQUES_SOURCES.CATNAT,
        responseTimeMs,
      };
    }
  }

  /**
   * Normalise les données brutes de l'API CATNAT
   */
  private normalizeCatnatData(data: CatnatApiResponse): CatnatResultNormalized {
    const evenements = data.data || [];

    // Trier par date de début décroissante (plus récent en premier)
    const evenementsTries = [...evenements].sort((a, b) => {
      return new Date(b.date_debut_evt).getTime() - new Date(a.date_debut_evt).getTime();
    });

    // Extraire les GEORISQUES_NOMBRE_RESULTATS_RECENTS.CATNAT événements les plus récents
    const evenementsRecents = evenementsTries
      .slice(0, GEORISQUES_NOMBRE_RESULTATS_RECENTS.CATNAT)
      .map((evt) => this.normalizeEvent(evt));

    // Extraire les types de risques uniques
    const typesRisques = [...new Set(evenements.map((evt) => evt.libelle_risque_jo))];

    // Dernier événement
    const dernierEvenement =
      evenementsTries.length > 0 ? this.normalizeEvent(evenementsTries[0]) : undefined;

    return {
      nombreEvenements: evenements.length,
      evenementsRecents,
      typesRisques,
      dernierEvenement,
      exposition: evenements.length > 0,
      source: GEORISQUES_SOURCES.CATNAT,
      dateRecuperation: new Date().toISOString(),
    };
  }

  /**
   * Normalise un événement CATNAT individuel
   */
  private normalizeEvent(evt: any): CatnatEventNormalized {
    return {
      codeNational: evt.code_national_catnat as string,
      typeRisque: evt.libelle_risque_jo as string,
      dateDebut: evt.date_debut_evt as string,
      dateFin: evt.date_fin_evt as string,
      datePublication: evt.date_publication_jo as string,
    };
  }
}
