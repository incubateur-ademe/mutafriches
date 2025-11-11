import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

import { ApiResponse } from "../shared/api-response.types";
import {
  IgnWfsServiceResponse,
  IgnWfsFeatureCollection,
  IgnWfsTronconRoute,
} from "./ign-wfs.types";
import { convertWgs84ToEpsg3857, distancePointToSegment } from "../shared/distance.utils";

/**
 * Adapter pour l'API WFS IGN Géoplateforme
 * https://geoservices.ign.fr/services-web-essentiels
 *
 * Récupère les tronçons de routes (autoroutes, voies rapides)
 * depuis la BD TOPO v3
 */
@Injectable()
export class IgnWfsService {
  private readonly logger = new Logger(IgnWfsService.name);
  private readonly baseUrl = "https://data.geopf.fr/wfs/ows";

  constructor(private readonly httpService: HttpService) {}

  /**
   * Recherche la voie de grande circulation la plus proche
   *
   * @param latitude - Latitude WGS84 de la parcelle
   * @param longitude - Longitude WGS84 de la parcelle
   * @param rayonMetres - Rayon de recherche en mètres (défaut: 15000m = 15km)
   * @returns Distance en mètres à la voie la plus proche
   */
  async getDistanceVoieGrandeCirculation(
    latitude: number,
    longitude: number,
    rayonMetres: number = 15000,
  ): Promise<ApiResponse<IgnWfsServiceResponse>> {
    const startTime = Date.now();

    try {
      // Convertir WGS84 (lat/lon) en Web Mercator EPSG:3857 pour DWITHIN
      const { x, y } = convertWgs84ToEpsg3857(longitude, latitude);

      this.logger.debug(
        `Recherche voies circulation: lat=${latitude.toFixed(5)}, lon=${longitude.toFixed(5)} ` +
          `(EPSG:3857: x=${x.toFixed(2)}, y=${y.toFixed(2)}), rayon=${rayonMetres}m`,
      );

      // Construction de la requête WFS avec filtre CQL
      const url = this.baseUrl;
      const params = {
        SERVICE: "WFS",
        VERSION: "2.0.0",
        REQUEST: "GetFeature",
        TYPENAMES: "BDTOPO_V3:troncon_de_route",
        SRSNAME: "EPSG:3857", // Web Mercator pour DWITHIN en mètres
        OUTPUTFORMAT: "application/json",
        // Filtre : voies grande circulation (autoroutes, 2 chaussées) + rayon
        CQL_FILTER:
          `(NATURE IN ('Type autoroutier','Route à 2 chaussées','Bretelle') ` +
          `OR IMPORTANCE IN (1,2)) ` +
          `AND DWITHIN(geom, SRID=3857;POINT(${x} ${y}), ${rayonMetres}, meters)`,
      };

      this.logger.debug(`Requête WFS: ${this.formatParams(params)}`);

      const response = await firstValueFrom(
        this.httpService.get<IgnWfsFeatureCollection>(url, { params }),
      );

      const data = response.data;

      if (!data.features || data.features.length === 0) {
        this.logger.warn(`Aucune voie grande circulation dans un rayon de ${rayonMetres}m`);
        return {
          success: false,
          error: `Aucune voie dans un rayon de ${rayonMetres}m`,
          source: "IGN WFS",
          responseTimeMs: Date.now() - startTime,
        };
      }

      this.logger.debug(`API WFS retourne ${data.features.length} tronçon(s) dans le rayon`);

      // Calculer la distance minimale à tous les tronçons retournés
      const distanceMinimale = this.calculerDistanceMinimale(longitude, latitude, data.features);

      const responseTimeMs = Date.now() - startTime;

      this.logger.log(
        `Voie grande circulation la plus proche: ${Math.round(distanceMinimale)}m ` +
          `(lat=${latitude.toFixed(5)}, lon=${longitude.toFixed(5)})`,
      );

      return {
        success: true,
        data: {
          distanceMetres: distanceMinimale,
          nombreTronconsProches: data.features.length,
        },
        source: "IGN WFS",
        responseTimeMs,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      this.logger.error(
        `Erreur API WFS IGN pour lat=${latitude}, lon=${longitude}:`,
        (error as Error).stack,
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur API WFS IGN",
        source: "IGN WFS",
        responseTimeMs,
      };
    }
  }

  /**
   * Calcule la distance minimale entre un point et un ensemble de tronçons
   * Utilise la formule de Haversine pour chaque segment
   */
  private calculerDistanceMinimale(
    lonPoint: number,
    latPoint: number,
    troncons: IgnWfsTronconRoute[],
  ): number {
    let distanceMin = Infinity;

    for (const troncon of troncons) {
      if (
        !troncon.geometry ||
        troncon.geometry.type !== "LineString" ||
        !troncon.geometry.coordinates
      ) {
        continue;
      }

      // Pour chaque segment de la LineString, calculer la distance
      const coords = troncon.geometry.coordinates as number[][];

      for (let i = 0; i < coords.length - 1; i++) {
        const [lon1, lat1] = coords[i];
        const [lon2, lat2] = coords[i + 1];

        // Distance au segment
        const dist = distancePointToSegment(lonPoint, latPoint, lon1, lat1, lon2, lat2);

        if (dist < distanceMin) {
          distanceMin = dist;
        }
      }
    }

    return distanceMin;
  }

  /**
   * Formate les paramètres pour le log
   */
  private formatParams(params: Record<string, string>): string {
    return Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
  }
}
