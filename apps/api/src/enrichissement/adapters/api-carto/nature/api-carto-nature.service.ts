import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ApiResponse } from "../../shared/api-response.types";
import { ParcelleGeometry } from "../../../services/shared/geometry.types";
import { ApiCartoNatureResponse } from "./api-carto-nature.types";

@Injectable()
export class ApiCartoNatureService {
  private readonly logger = new Logger(ApiCartoNatureService.name);
  private readonly baseUrl = "https://apicarto.ign.fr/api";
  private readonly timeout = 10000;

  constructor(private readonly httpService: HttpService) {}

  async queryNatura2000Habitats(
    geometry: ParcelleGeometry,
  ): Promise<ApiResponse<ApiCartoNatureResponse>> {
    return this.queryEndpoint("/nature/natura2000-directive-habitats", geometry);
  }

  async queryNatura2000Oiseaux(
    geometry: ParcelleGeometry,
  ): Promise<ApiResponse<ApiCartoNatureResponse>> {
    return this.queryEndpoint("/nature/natura2000-directive-oiseaux", geometry);
  }

  async queryZnieff1(geometry: ParcelleGeometry): Promise<ApiResponse<ApiCartoNatureResponse>> {
    return this.queryEndpoint("/nature/znieff1", geometry);
  }

  async queryZnieff2(geometry: ParcelleGeometry): Promise<ApiResponse<ApiCartoNatureResponse>> {
    return this.queryEndpoint("/nature/znieff2", geometry);
  }

  async queryParcNaturelRegional(
    geometry: ParcelleGeometry,
  ): Promise<ApiResponse<ApiCartoNatureResponse>> {
    return this.queryEndpoint("/nature/pnr", geometry);
  }

  async queryReservesNaturelles(
    geometry: ParcelleGeometry,
  ): Promise<ApiResponse<ApiCartoNatureResponse>> {
    return this.queryEndpoint("/nature/reserves-naturelles", geometry);
  }

  private async queryEndpoint(
    endpoint: string,
    geometry: ParcelleGeometry,
  ): Promise<ApiResponse<ApiCartoNatureResponse>> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}${endpoint}`;

      const response = await firstValueFrom(
        this.httpService.post<ApiCartoNatureResponse>(
          url,
          { geom: geometry },
          {
            timeout: this.timeout,
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          },
        ),
      );

      const data = response.data;

      if (!data || data.totalFeatures === 0) {
        this.logger.debug(`Aucune zone trouvée pour ${endpoint}`);
        return {
          success: true,
          data,
          source: `API Carto Nature - ${endpoint}`,
          responseTimeMs: Date.now() - startTime,
        };
      }

      return {
        success: true,
        data,
        source: `API Carto Nature - ${endpoint}`,
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      this.logger.warn(`Erreur API Carto Nature ${endpoint}: ${errorMessage}`);

      return {
        success: false,
        error: `Erreur lors de l'appel à ${endpoint}: ${errorMessage}`,
        source: `API Carto Nature - ${endpoint}`,
        responseTimeMs: Date.now() - startTime,
      };
    }
  }
}
