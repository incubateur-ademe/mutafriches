import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

import { ApiResponse } from "../shared/api-response.types";
import {
  IgnWfsServiceResponse,
  IgnWfsFeatureCollection,
  IgnWfsTronconRoute,
} from "./ign-wfs.types";
import { distancePointToSegment } from "../shared/distance.utils";

/**
 * Adapter pour l'API WFS IGN Géoplateforme
 * https://geoservices.ign.fr/services-web-essentiels
 *
 * Récupère les tronçons de routes (autoroutes, voies rapides) depuis la BD TOPO v3
 * Documentation https://geoservices.ign.fr/sites/default/files/2024-08/DC_BDTOPO_3-4.pdf
 * Types de routes : page 336 : Valeurs autorisées : "Bretelle" ; "Chemin" ; "Escalier" ; "Bac ou liaison maritime" ; "Rond-point" ; "Route empierrée"
; "Route à 1 chaussée" ; "Route à 2 chaussées" ; "Sentier" ; "Type autoroutier
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
      // Filtrage côté serveur (DWITHIN + nature/importance) pour éviter le plafond de 5000
      // tronçons de geopf : sur une BBOX large sans filtre, le résultat était tronqué et pouvait
      // exclure l'autoroute la plus proche (distance surestimée). POINT en axes lat lon. Cf. ADR-0028.
      const cqlFilter =
        `DWITHIN(geometrie,POINT(${latitude} ${longitude}),${rayonMetres},meters)` +
        ` AND (nature IN ('Type autoroutier','Route à 2 chaussées','Bretelle') OR importance IN ('1','2'))`;

      this.logger.debug(
        `Recherche voies circulation: lat=${latitude.toFixed(5)}, lon=${longitude.toFixed(5)}, rayon=${rayonMetres}m`,
      );

      const url = this.baseUrl;
      const params = {
        SERVICE: "WFS",
        VERSION: "2.0.0",
        REQUEST: "GetFeature",
        TYPENAMES: "BDTOPO_V3:troncon_de_route",
        SRSNAME: "EPSG:4326",
        OUTPUTFORMAT: "application/json",
        CQL_FILTER: cqlFilter,
      };

      this.logger.debug(`Requête WFS CQL: ${cqlFilter}`);

      const response = await firstValueFrom(
        this.httpService.get<IgnWfsFeatureCollection>(url, { params }),
      );

      const data = response.data;

      if (!data.features || data.features.length === 0) {
        this.logger.warn(`Aucun tronçon de grande circulation dans un rayon de ${rayonMetres}m`);
        return {
          success: false,
          error: `Aucune voie dans un rayon de ${rayonMetres}m`,
          source: "IGN WFS",
          responseTimeMs: Date.now() - startTime,
        };
      }

      this.logger.debug(
        `API WFS retourne ${data.features.length} tronçon(s) de grande circulation dans le rayon`,
      );

      // Filtrer par NATURE/IMPORTANCE + calculer distance
      const { distanceMinimale, tronconsInRadius } = this.calculerDistanceMinimaleAvecFiltre(
        longitude,
        latitude,
        data.features,
        rayonMetres,
      );

      if (distanceMinimale === Infinity || tronconsInRadius === 0) {
        this.logger.warn(
          `Aucune voie grande circulation dans le rayon de ${rayonMetres}m après filtrage`,
        );
        return {
          success: false,
          error: `Aucune voie grande circulation dans un rayon de ${rayonMetres}m`,
          source: "IGN WFS",
          responseTimeMs: Date.now() - startTime,
        };
      }

      const responseTimeMs = Date.now() - startTime;

      this.logger.log(
        `Voie grande circulation la plus proche: ${Math.round(distanceMinimale)}m ` +
          `(${tronconsInRadius} tronçons dans rayon)`,
      );

      return {
        success: true,
        data: {
          distanceMetres: distanceMinimale,
          nombreTronconsProches: tronconsInRadius,
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
   * Calcule distance minimale + filtre par NATURE/IMPORTANCE + rayon
   */
  private calculerDistanceMinimaleAvecFiltre(
    lonPoint: number,
    latPoint: number,
    troncons: IgnWfsTronconRoute[],
    rayonMetres: number,
  ): { distanceMinimale: number; tronconsInRadius: number } {
    let distanceMin = Infinity;
    let tronconsInRadius = 0;

    const naturesAcceptees = new Set(["Type autoroutier", "Route à 2 chaussées", "Bretelle"]);

    for (const troncon of troncons) {
      if (
        !troncon.geometry ||
        troncon.geometry.type !== "LineString" ||
        !troncon.geometry.coordinates
      ) {
        continue;
      }

      const props = troncon.properties;

      const isGrandeCirculation =
        naturesAcceptees.has(props.nature) || props.importance === "1" || props.importance === "2";

      if (!isGrandeCirculation) {
        continue;
      }

      const coords = troncon.geometry.coordinates as number[][];
      let tronconInRadius = false;

      for (let i = 0; i < coords.length - 1; i++) {
        const [lon1, lat1] = coords[i];
        const [lon2, lat2] = coords[i + 1];

        const dist = distancePointToSegment(lonPoint, latPoint, lon1, lat1, lon2, lat2);

        if (dist <= rayonMetres) {
          tronconInRadius = true;
          if (dist < distanceMin) {
            distanceMin = dist;
          }
        }
      }

      if (tronconInRadius) {
        tronconsInRadius++;
      }
    }

    return { distanceMinimale: distanceMin, tronconsInRadius };
  }
}
