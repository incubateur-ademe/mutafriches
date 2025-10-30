import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ApiResponse } from "../../shared/api-response.types";
import {
  CavitesApiResponse,
  CavitesResultNormalized,
  CavitesSearchParams,
  CaviteNormalized,
  CaviteItem,
} from "./cavites.types";
import {
  GEORISQUES_API_BASE_URL,
  GEORISQUES_ENDPOINTS,
  GEORISQUES_SOURCES,
  GEORISQUES_TIMEOUT_MS,
  GEORISQUES_RAYONS_DEFAUT,
  GEORISQUES_NOMBRE_RESULTATS_RECENTS,
} from "../georisques.constants";
import { calculateDistance } from "../../shared/distance.utils";

@Injectable()
export class CavitesService {
  private readonly logger = new Logger(CavitesService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.GEORISQUES_API_URL || GEORISQUES_API_BASE_URL;
  }

  /**
   * Récupère les cavités souterraines pour une localisation
   */
  async getCavites(params: CavitesSearchParams): Promise<ApiResponse<CavitesResultNormalized>> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}${GEORISQUES_ENDPOINTS.CAVITES}`;
      const latlon = `${params.longitude},${params.latitude}`;
      const rayon = params.rayon || GEORISQUES_RAYONS_DEFAUT.CAVITES;

      this.logger.debug(`Appel API Cavités: ${url}?latlon=${latlon}&rayon=${rayon}`);

      const response = await firstValueFrom(
        this.httpService.get<CavitesApiResponse>(url, {
          params: {
            latlon,
            rayon,
            page: 1,
            page_size: 100,
          },
          timeout: GEORISQUES_TIMEOUT_MS,
        }),
      );

      const data = response.data;

      // Gérer les réponses vides (aucune cavité)
      if (!data || !data.data || data.data.length === 0) {
        this.logger.log(
          `Aucune cavité souterraine pour lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)}, rayon=${rayon}m`,
        );

        const normalized: CavitesResultNormalized = {
          exposition: false,
          nombreCavites: 0,
          cavitesProches: [],
          typesCavites: [],
          source: GEORISQUES_SOURCES.CAVITES,
          dateRecuperation: new Date().toISOString(),
        };

        return {
          success: true,
          data: normalized,
          source: GEORISQUES_SOURCES.CAVITES,
          responseTimeMs: Date.now() - startTime,
        };
      }

      // Normalisation des données
      const normalized = this.normalizeCavitesData(data, params.latitude, params.longitude);

      const responseTimeMs = Date.now() - startTime;

      this.logger.log(
        `Cavités: lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)} → ` +
          `${normalized.nombreCavites} cavités, types: ${normalized.typesCavites.join(", ")}, ` +
          `plus proche: ${normalized.distancePlusProche ? `${Math.round(normalized.distancePlusProche)}m` : "N/A"}`,
      );

      return {
        success: true,
        data: normalized,
        source: GEORISQUES_SOURCES.CAVITES,
        responseTimeMs,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";

      this.logger.error(
        `Erreur API Cavités pour lat=${params.latitude}, lon=${params.longitude}: ${errorMessage}`,
        (error as Error).stack,
      );

      return {
        success: false,
        error: errorMessage,
        source: GEORISQUES_SOURCES.CAVITES,
        responseTimeMs,
      };
    }
  }

  /**
   * Normalise les données brutes de l'API Cavités
   */
  private normalizeCavitesData(
    data: CavitesApiResponse,
    searchLat: number,
    searchLon: number,
  ): CavitesResultNormalized {
    const items = data.data || [];

    // Calculer la distance pour chaque cavité et normaliser
    const cavitesAvecDistance = items.map((item) => {
      const distance = calculateDistance(searchLat, searchLon, item.latitude, item.longitude);
      return {
        ...this.normalizeCavite(item),
        distance,
      };
    });

    // Trier par distance (plus proche en premier)
    cavitesAvecDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    // Prendre les N cavités les plus proches
    const cavitesProches = cavitesAvecDistance.slice(
      0,
      GEORISQUES_NOMBRE_RESULTATS_RECENTS.CAVITES,
    );

    // Extraire les types de cavités uniques
    const typesCavites = [...new Set(items.map((item) => item.type))];

    // Cavité la plus proche
    const plusProche = cavitesAvecDistance.length > 0 ? cavitesAvecDistance[0] : undefined;

    return {
      exposition: items.length > 0,
      nombreCavites: items.length,
      cavitesProches,
      typesCavites,
      plusProche,
      distancePlusProche: plusProche?.distance,
      source: GEORISQUES_SOURCES.CAVITES,
      dateRecuperation: new Date().toISOString(),
    };
  }

  /**
   * Normalise une cavité individuelle
   */
  private normalizeCavite(item: CaviteItem): CaviteNormalized {
    return {
      identifiant: item.identifiant,
      type: item.type,
      nom: item.nom,
      reperageGeo: item.reperage_geo,
      latitude: item.latitude,
      longitude: item.longitude,
    };
  }
}
