import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ApiResponse } from "../../shared/api-response.types";
import {
  MvtApiResponse,
  MvtResultNormalized,
  MvtSearchParams,
  MvtNormalized,
  MvtItem,
} from "./mvt.types";
import {
  GEORISQUES_API_BASE_URL,
  GEORISQUES_ENDPOINTS,
  GEORISQUES_SOURCES,
  GEORISQUES_TIMEOUT_MS,
  GEORISQUES_RAYONS_DEFAUT,
  GEORISQUES_NOMBRE_RESULTATS_RECENTS,
} from "../georisques.constants";

@Injectable()
export class MvtService {
  private readonly logger = new Logger(MvtService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.GEORISQUES_API_URL || GEORISQUES_API_BASE_URL;
  }

  /**
   * Récupère les mouvements de terrain pour une localisation
   */
  async getMvt(params: MvtSearchParams): Promise<ApiResponse<MvtResultNormalized>> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}${GEORISQUES_ENDPOINTS.MVT}`;
      const latlon = `${params.longitude},${params.latitude}`;
      const rayon = params.rayon || GEORISQUES_RAYONS_DEFAUT.MVT;

      this.logger.debug(`Appel API MVT: ${url}?latlon=${latlon}&rayon=${rayon}`);

      const response = await firstValueFrom(
        this.httpService.get<MvtApiResponse>(url, {
          params: {
            latlon,
            rayon,
            page: 1,
            page_size: 100, // Récupérer jusqu'à 100 mouvements
          },
          timeout: GEORISQUES_TIMEOUT_MS,
        }),
      );

      const data = response.data;

      // Gérer les réponses vides (aucun mouvement)
      if (!data || !data.data || data.data.length === 0) {
        this.logger.log(
          `Aucun mouvement de terrain pour lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)}, rayon=${rayon}m`,
        );

        const normalized: MvtResultNormalized = {
          exposition: false,
          nombreMouvements: 0,
          mouvementsRecents: [],
          typesMouvements: [],
          fiabilites: [],
          source: GEORISQUES_SOURCES.MVT,
          dateRecuperation: new Date().toISOString(),
        };

        return {
          success: true,
          data: normalized,
          source: GEORISQUES_SOURCES.MVT,
          responseTimeMs: Date.now() - startTime,
        };
      }

      // Normalisation des données
      const normalized = this.normalizeMvtData(data, params.latitude, params.longitude);

      const responseTimeMs = Date.now() - startTime;

      this.logger.log(
        `MVT: lat=${params.latitude.toFixed(5)}, lon=${params.longitude.toFixed(5)} → ` +
          `${normalized.nombreMouvements} mouvements, types: ${normalized.typesMouvements.join(", ")}, ` +
          `plus proche: ${normalized.distancePlusProche ? `${Math.round(normalized.distancePlusProche)}m` : "N/A"}`,
      );

      return {
        success: true,
        data: normalized,
        source: GEORISQUES_SOURCES.MVT,
        responseTimeMs,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";

      this.logger.error(
        `Erreur API MVT pour lat=${params.latitude}, lon=${params.longitude}: ${errorMessage}`,
        (error as Error).stack,
      );

      return {
        success: false,
        error: errorMessage,
        source: GEORISQUES_SOURCES.MVT,
        responseTimeMs,
      };
    }
  }

  /**
   * Normalise les données brutes de l'API MVT
   */
  private normalizeMvtData(
    data: MvtApiResponse,
    searchLat: number,
    searchLon: number,
  ): MvtResultNormalized {
    const items = data.data || [];

    // Calculer la distance pour chaque mouvement et normaliser
    const mouvementsAvecDistance = items.map((item) => {
      const distance = this.calculateDistance(searchLat, searchLon, item.latitude, item.longitude);
      return {
        ...this.normalizeMvt(item),
        distance,
      };
    });

    // Trier par distance (plus proche en premier)
    mouvementsAvecDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    // Prendre les N mouvements les plus proches
    const mouvementsRecents = mouvementsAvecDistance.slice(
      0,
      GEORISQUES_NOMBRE_RESULTATS_RECENTS.MVT,
    );

    // Extraire les types de mouvements uniques
    const typesMouvements = [...new Set(items.map((item) => item.type))];

    // Extraire les niveaux de fiabilité uniques
    const fiabilites = [...new Set(items.map((item) => item.fiabilite))];

    // Mouvement le plus proche
    const plusProche = mouvementsAvecDistance.length > 0 ? mouvementsAvecDistance[0] : undefined;

    return {
      exposition: items.length > 0,
      nombreMouvements: items.length,
      mouvementsRecents,
      typesMouvements,
      fiabilites,
      plusProche,
      distancePlusProche: plusProche?.distance,
      source: GEORISQUES_SOURCES.MVT,
      dateRecuperation: new Date().toISOString(),
    };
  }

  /**
   * Normalise un mouvement de terrain individuel
   */
  private normalizeMvt(item: MvtItem): MvtNormalized {
    return {
      identifiant: item.identifiant,
      type: item.type,
      fiabilite: item.fiabilite,
      lieu: item.lieu,
      dateDebut: item.date_debut,
      latitude: item.latitude,
      longitude: item.longitude,
    };
  }

  /**
   * Calcule la distance entre deux points GPS (formule de Haversine)
   * @returns Distance en mètres
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance en mètres
  }
}
