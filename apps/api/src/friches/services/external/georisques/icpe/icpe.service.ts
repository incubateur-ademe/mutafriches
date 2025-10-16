import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ApiResponse } from "../../shared/api-response.types";
import {
  IcpeApiResponse,
  IcpeResultNormalized,
  IcpeSearchByInseeParams,
  IcpeSearchByLatLonParams,
  IcpeSummary,
} from "./icpe.types";
import {
  GEORISQUES_API_BASE_URL,
  GEORISQUES_ENDPOINTS,
  GEORISQUES_SOURCES,
  GEORISQUES_TIMEOUT_MS,
  GEORISQUES_RAYONS_DEFAUT,
  GEORISQUES_NOMBRE_RESULTATS_RECENTS,
} from "../georisques.constants";

@Injectable()
export class IcpeService {
  private readonly logger = new Logger(IcpeService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.GEORISQUES_API_URL || GEORISQUES_API_BASE_URL;
  }

  /**
   * Récupère les installations classées par code INSEE
   */
  async getIcpeByCodeInsee(
    params: IcpeSearchByInseeParams,
  ): Promise<ApiResponse<IcpeResultNormalized>> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}${GEORISQUES_ENDPOINTS.ICPE}`;
      const pageSize = params.pageSize || 100;

      this.logger.debug(`Appel API ICPE par code INSEE: ${url}?code_insee=${params.codeInsee}`);

      const response = await firstValueFrom(
        this.httpService.get<IcpeApiResponse>(url, {
          params: {
            code_insee: params.codeInsee,
            page_size: pageSize,
          },
          timeout: GEORISQUES_TIMEOUT_MS,
        }),
      );

      const data = response.data;

      // Normalisation des données
      const normalized = this.normalizeIcpeData(data);

      const responseTimeMs = Date.now() - startTime;

      this.logger.log(
        `ICPE (INSEE ${params.codeInsee}): ${normalized.nombreIcpe} installations trouvees`,
      );

      return {
        success: true,
        data: normalized,
        source: GEORISQUES_SOURCES.ICPE,
        responseTimeMs,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";

      this.logger.error(
        `Erreur API ICPE pour INSEE ${params.codeInsee}: ${errorMessage}`,
        (error as Error).stack,
      );

      return {
        success: false,
        error: errorMessage,
        source: GEORISQUES_SOURCES.ICPE,
        responseTimeMs,
      };
    }
  }

  /**
   * Récupère les installations classées par coordonnées géographiques
   */
  async getIcpeByLatLon(
    params: IcpeSearchByLatLonParams,
  ): Promise<ApiResponse<IcpeResultNormalized>> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}${GEORISQUES_ENDPOINTS.ICPE}`;
      const latlon = `${params.longitude},${params.latitude}`;
      const rayon = params.rayon || GEORISQUES_RAYONS_DEFAUT.ICPE;
      const pageSize = params.pageSize || 100;

      this.logger.debug(`Appel API ICPE par latlon: ${url}?latlon=${latlon}&rayon=${rayon}`);

      const response = await firstValueFrom(
        this.httpService.get<IcpeApiResponse>(url, {
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
      const normalized = this.normalizeIcpeData(data);

      const responseTimeMs = Date.now() - startTime;

      this.logger.log(
        `ICPE (lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)}, rayon=${rayon}m): ` +
          `${normalized.nombreIcpe} installations trouvees`,
      );

      return {
        success: true,
        data: normalized,
        source: GEORISQUES_SOURCES.ICPE,
        responseTimeMs,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";

      this.logger.error(
        `Erreur API ICPE pour lat=${params.latitude}, lon=${params.longitude}: ${errorMessage}`,
        (error as Error).stack,
      );

      return {
        success: false,
        error: errorMessage,
        source: GEORISQUES_SOURCES.ICPE,
        responseTimeMs,
      };
    }
  }

  /**
   * Normalise les données brutes de l'API ICPE
   */
  private normalizeIcpeData(data: IcpeApiResponse): IcpeResultNormalized {
    const presenceIcpe = data.results > 0;
    const nombreIcpe = data.results;

    // Compter les installations SEVESO
    const nombreSeveso = data.data.filter(
      (icpe) => icpe.statutSeveso === "1" || icpe.statutSeveso === "2",
    ).length;
    const presenceSeveso = nombreSeveso > 0;

    // Compter les installations priorité nationale
    const presencePrioriteNationale = data.data.some((icpe) => icpe.prioriteNationale === true);

    // Limiter aux N premiers résultats les plus pertinents
    const icpeLimitees = data.data.slice(0, GEORISQUES_NOMBRE_RESULTATS_RECENTS.ICPE);

    const icpeProches: IcpeSummary[] = icpeLimitees.map((icpe) => {
      // Construire l'adresse complète
      const adresseParts = [icpe.adresse1, icpe.adresse2, icpe.adresse3].filter(
        (part) => part && part.trim() !== "",
      );
      const adresseComplete = adresseParts.join(", ");

      // Trouver la dernière inspection
      const derniereInspection =
        icpe.inspections.length > 0
          ? icpe.inspections
              .map((insp) => new Date(insp.dateInspection).getTime())
              .sort((a, b) => b - a)[0]
          : undefined;

      return {
        codeAIOT: icpe.codeAIOT,
        raisonSociale: icpe.raisonSociale,
        adresseComplete,
        commune: icpe.commune,
        codePostal: icpe.codePostal,
        regime: icpe.regime,
        statutSeveso: icpe.statutSeveso,
        etatActivite: icpe.etatActivite,
        prioriteNationale: icpe.prioriteNationale,
        ied: icpe.ied,
        coordonnees: {
          latitude: icpe.latitude,
          longitude: icpe.longitude,
        },
        nombreInspections: icpe.inspections.length,
        derniereInspection: derniereInspection
          ? new Date(derniereInspection).toISOString()
          : undefined,
        dateMaj: icpe.date_maj,
      };
    });

    return {
      presenceIcpe,
      nombreIcpe,
      icpeProches,
      presenceSeveso,
      nombreSeveso,
      presencePrioriteNationale,
      source: GEORISQUES_SOURCES.ICPE,
      dateRecuperation: new Date().toISOString(),
    };
  }
}
