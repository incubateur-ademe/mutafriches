import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { getAppConfig } from "../../../../config";
import { ApiResponse } from "../../shared/api-response.types";
import {
  CasiasApiResponse,
  CasiasResultNormalized,
  CasiasSearchByLatLonParams,
  CasiasSummary,
} from "./casias.types";
import {
  GEORISQUES_API_BASE_URL,
  GEORISQUES_ENDPOINTS,
  GEORISQUES_NOMBRE_RESULTATS_RECENTS,
  GEORISQUES_RAYONS_DEFAUT,
  GEORISQUES_SOURCES,
  GEORISQUES_TIMEOUT_MS,
} from "../georisques.constants";

@Injectable()
export class CasiasService {
  private readonly logger = new Logger(CasiasService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = getAppConfig().externalApis.georisquesUrl ?? GEORISQUES_API_BASE_URL;
  }

  // Sites CASIAS dans un rayon autour d'un point
  async getCasiasByLatLon(
    params: CasiasSearchByLatLonParams,
  ): Promise<ApiResponse<CasiasResultNormalized>> {
    const startTime = Date.now();
    const rayon = params.rayon ?? GEORISQUES_RAYONS_DEFAUT.CASIAS;

    try {
      const response = await firstValueFrom(
        this.httpService.get<CasiasApiResponse>(`${this.baseUrl}${GEORISQUES_ENDPOINTS.CASIAS}`, {
          params: {
            latlon: `${params.longitude},${params.latitude}`,
            rayon,
            // Le total vient de `results` : une courte page suffit, sans pagination
            page: 1,
            page_size: GEORISQUES_NOMBRE_RESULTATS_RECENTS.CASIAS,
          },
          timeout: GEORISQUES_TIMEOUT_MS,
        }),
      );

      const normalized = this.normaliser(response.data as CasiasApiResponse, rayon);

      this.logger.log(
        `CASIAS (lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)}, rayon=${rayon}m): ` +
          `${normalized.nombreCasias} sites trouvés`,
      );

      return {
        success: true,
        data: normalized,
        source: GEORISQUES_SOURCES.CASIAS,
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";

      this.logger.warn(
        `Erreur API CASIAS pour lat=${params.latitude}, lon=${params.longitude}: ${errorMessage}`,
      );

      return {
        success: false,
        error: errorMessage,
        source: GEORISQUES_SOURCES.CASIAS,
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  private normaliser(data: CasiasApiResponse, rayon: number): CasiasResultNormalized {
    const sites = Array.isArray(data?.data) ? data.data : [];
    const nombreCasias = typeof data?.results === "number" ? data.results : sites.length;

    const casiasProches: CasiasSummary[] = sites
      .slice(0, GEORISQUES_NOMBRE_RESULTATS_RECENTS.CASIAS)
      .map((site) => ({
        id: site.identifiant_casias ?? site.identifiant_ssp,
        nom: site.nom_etablissement,
        adresse: site.adresse ?? site.adresse_lieudit,
        commune: site.nom_commune,
        statut: site.statut,
        ficheRisque: site.fiche_risque,
      }));

    return {
      presenceCasias: nombreCasias > 0,
      nombreCasias,
      casiasProches,
      rayonMetres: rayon,
      source: GEORISQUES_SOURCES.CASIAS,
      dateRecuperation: new Date().toISOString(),
    };
  }
}
