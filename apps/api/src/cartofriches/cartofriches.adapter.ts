import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { timeout } from "rxjs/operators";
import { FrichesCerema, GeometrieParcelle } from "@mutafriches/shared-types";
import { ApiResponse } from "../enrichissement/adapters/shared/api-response.types";
import {
  CARTOFRICHES_API_BASE_URL,
  CARTOFRICHES_MAX_PAGES,
  CARTOFRICHES_PAGE_SIZE,
  CARTOFRICHES_SOURCE,
  CARTOFRICHES_TIMEOUT_MS,
} from "./cartofriches.constants";

interface PaginatedFrichesResponse {
  count: number;
  next: string | null;
  results: FrichesCerema[];
}

/** Feature GeoJSON renvoyée par l'endpoint geofriches (properties = FrichesCerema partiel) */
export interface GeoFricheFeature {
  type: "Feature";
  geometry: GeometrieParcelle | null;
  properties: FrichesCerema;
}

interface GeoFrichesCollection {
  type: "FeatureCollection";
  count: number;
  next: string | null;
  features: GeoFricheFeature[];
}

/**
 * Adapter HTTP vers l'API Cartofriches du Cerema (accès libre).
 *
 * Utilise systématiquement `fields=all` pour récupérer les champs sources non documentés
 * (distances ITE, ZAER, zonage environnemental, indices de mutabilité).
 */
@Injectable()
export class CartofrichesAdapter {
  private readonly logger = new Logger(CartofrichesAdapter.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Récupère toutes les friches d'une commune (pagination suivie automatiquement).
   */
  async getFrichesParCommune(codeInsee: string): Promise<ApiResponse<FrichesCerema[]>> {
    const startTime = Date.now();
    const url = `${CARTOFRICHES_API_BASE_URL}/cartofriches/friches/`;

    try {
      const friches: FrichesCerema[] = [];
      let page = 1;

      while (page <= CARTOFRICHES_MAX_PAGES) {
        const response = await firstValueFrom(
          this.httpService
            .get(url, {
              params: {
                code_insee: codeInsee,
                fields: "all",
                page_size: CARTOFRICHES_PAGE_SIZE,
                page,
              },
            })
            .pipe(timeout(CARTOFRICHES_TIMEOUT_MS)),
        );

        const data = response.data as PaginatedFrichesResponse;
        friches.push(...(data.results ?? []));

        if (!data.next) {
          break;
        }
        page += 1;
      }

      return {
        success: true,
        data: friches,
        source: CARTOFRICHES_SOURCE,
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Erreur API Cartofriches (commune ${codeInsee}) : ${err.message}`);
      return {
        success: false,
        error: err.message,
        source: CARTOFRICHES_SOURCE,
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Récupère les friches d'une commune en GeoJSON (emprises géométriques incluses),
   * pour l'affichage carte + liste. Pagination suivie automatiquement.
   */
  async getGeofrichesParCommune(codeInsee: string): Promise<ApiResponse<GeoFricheFeature[]>> {
    const startTime = Date.now();
    const url = `${CARTOFRICHES_API_BASE_URL}/cartofriches/geofriches/`;

    try {
      const features: GeoFricheFeature[] = [];
      let page = 1;

      while (page <= CARTOFRICHES_MAX_PAGES) {
        const response = await firstValueFrom(
          this.httpService
            .get(url, {
              params: {
                code_insee: codeInsee,
                fields: "all",
                page_size: CARTOFRICHES_PAGE_SIZE,
                page,
              },
            })
            .pipe(timeout(CARTOFRICHES_TIMEOUT_MS)),
        );

        const data = response.data as GeoFrichesCollection;
        features.push(...(data.features ?? []));

        if (!data.next) {
          break;
        }
        page += 1;
      }

      return {
        success: true,
        data: features,
        source: CARTOFRICHES_SOURCE,
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Erreur API geofriches (commune ${codeInsee}) : ${err.message}`);
      return {
        success: false,
        error: err.message,
        source: CARTOFRICHES_SOURCE,
        responseTimeMs: Date.now() - startTime,
      };
    }
  }
}
