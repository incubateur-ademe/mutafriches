import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

import { ApiResponse } from "../shared/api-response.types";
import { IgnWfsFeatureCollection, IgnWfsTronconRoute } from "./ign-wfs.types";

const IGN_WFS_TIMEOUT_MS = 30000;

/**
 * Adapter WFS IGN Géoplateforme, couche BD TOPO v3 `troncon_de_route`.
 * Nomenclature : https://geoservices.ign.fr/sites/default/files/2024-08/DC_BDTOPO_3-4.pdf
 */
@Injectable()
export class IgnWfsService {
  private readonly logger = new Logger(IgnWfsService.name);
  private readonly baseUrl = "https://data.geopf.fr/wfs/ows";

  constructor(private readonly httpService: HttpService) {}

  // Tronçons autoroutiers et bretelles dans le rayon. Filtre serveur pour rester sous le plafond
  // de 5000 objets de geopf (ADR-0028) ; POINT en axes lat lon.
  async getTronconsAutoroutiers(
    latitude: number,
    longitude: number,
    rayonMetres: number,
  ): Promise<ApiResponse<IgnWfsTronconRoute[]>> {
    const startTime = Date.now();

    try {
      const cqlFilter =
        `DWITHIN(geometrie,POINT(${latitude} ${longitude}),${rayonMetres},meters)` +
        ` AND nature IN ('Type autoroutier','Bretelle')`;

      const params = {
        SERVICE: "WFS",
        VERSION: "2.0.0",
        REQUEST: "GetFeature",
        TYPENAMES: "BDTOPO_V3:troncon_de_route",
        SRSNAME: "EPSG:4326",
        OUTPUTFORMAT: "application/json",
        PROPERTYNAME: "nature,sens_de_circulation,geometrie",
        CQL_FILTER: cqlFilter,
      };

      const response = await firstValueFrom(
        this.httpService.get<IgnWfsFeatureCollection>(this.baseUrl, {
          params,
          timeout: IGN_WFS_TIMEOUT_MS,
        }),
      );

      const troncons = (response.data.features ?? []).filter(
        (f) => f.geometry?.type === "LineString" && (f.geometry.coordinates?.length ?? 0) >= 2,
      );

      this.logger.debug(`${troncons.length} tronçon(s) autoroutier(s) dans ${rayonMetres} m`);

      return {
        success: true,
        data: troncons,
        source: "IGN WFS",
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.warn(
        `Erreur API WFS IGN pour lat=${latitude}, lon=${longitude} : ${(error as Error).message}`,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur API WFS IGN",
        source: "IGN WFS",
        responseTimeMs: Date.now() - startTime,
      };
    }
  }
}
