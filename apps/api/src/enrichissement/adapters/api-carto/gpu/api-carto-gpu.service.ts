import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ApiResponse } from "../../shared/api-response.types";
import { ParcelleGeometry } from "../../../services/shared/geometry.types";
import { ApiCartoGpuResponse, MunicipalityInfo } from "./api-carto-gpu.types";

@Injectable()
export class ApiCartoGpuService {
  private readonly logger = new Logger(ApiCartoGpuService.name);
  private readonly baseUrl = "https://apicarto.ign.fr/api";
  private readonly timeout = 10000;

  constructor(private readonly httpService: HttpService) {}

  async getMunicipalityInfo(codeInsee: string): Promise<ApiResponse<MunicipalityInfo>> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}/gpu/municipality?insee=${codeInsee}`;

      const response = await firstValueFrom(
        this.httpService.get<ApiCartoGpuResponse>(url, {
          timeout: this.timeout,
          headers: {
            Accept: "application/json",
          },
        }),
      );

      const data = response.data;

      if (!data || data.totalFeatures === 0) {
        return {
          success: false,
          error: `Aucune information trouvée pour la commune ${codeInsee}`,
          source: "API Carto GPU - Municipality",
          responseTimeMs: Date.now() - startTime,
        };
      }

      const municipalityInfo = data.features[0].properties as MunicipalityInfo;

      return {
        success: true,
        data: municipalityInfo,
        source: "API Carto GPU - Municipality",
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      this.logger.warn(`Erreur getMunicipalityInfo pour ${codeInsee}: ${errorMessage}`);

      return {
        success: false,
        error: `Erreur lors de la récupération des infos commune: ${errorMessage}`,
        source: "API Carto GPU - Municipality",
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  async getZoneUrba(geometry: ParcelleGeometry): Promise<ApiResponse<ApiCartoGpuResponse>> {
    return this.queryEndpoint("/gpu/zone-urba", geometry);
  }

  async getSecteurCC(geometry: ParcelleGeometry): Promise<ApiResponse<ApiCartoGpuResponse>> {
    return this.queryEndpoint("/gpu/secteur-cc", geometry);
  }

  async getSupAC1(geometry: ParcelleGeometry): Promise<ApiResponse<ApiCartoGpuResponse>> {
    return this.querySupEndpoint("AC1", geometry);
  }

  async getSupAC2(geometry: ParcelleGeometry): Promise<ApiResponse<ApiCartoGpuResponse>> {
    return this.querySupEndpoint("AC2", geometry);
  }

  async getSupAC4(geometry: ParcelleGeometry): Promise<ApiResponse<ApiCartoGpuResponse>> {
    return this.querySupEndpoint("AC4", geometry);
  }

  private async querySupEndpoint(
    categorie: string,
    geometry: ParcelleGeometry,
  ): Promise<ApiResponse<ApiCartoGpuResponse>> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}/gpu/assiette-sup-s?categorie=${categorie}`;

      const response = await firstValueFrom(
        this.httpService.post<ApiCartoGpuResponse>(
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
        this.logger.debug(`Aucune SUP ${categorie} trouvée`);
        return {
          success: true,
          data,
          source: `API Carto GPU - SUP ${categorie}`,
          responseTimeMs: Date.now() - startTime,
        };
      }

      return {
        success: true,
        data,
        source: `API Carto GPU - SUP ${categorie}`,
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      this.logger.warn(`Erreur SUP ${categorie}: ${errorMessage}`);

      return {
        success: false,
        error: `Erreur lors de la récupération SUP ${categorie}: ${errorMessage}`,
        source: `API Carto GPU - SUP ${categorie}`,
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  private async queryEndpoint(
    endpoint: string,
    geometry: ParcelleGeometry,
  ): Promise<ApiResponse<ApiCartoGpuResponse>> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}${endpoint}`;

      const response = await firstValueFrom(
        this.httpService.post<ApiCartoGpuResponse>(
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
        this.logger.debug(`Aucune donnée trouvée pour ${endpoint}`);
        return {
          success: true,
          data,
          source: `API Carto GPU - ${endpoint}`,
          responseTimeMs: Date.now() - startTime,
        };
      }

      return {
        success: true,
        data,
        source: `API Carto GPU - ${endpoint}`,
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      this.logger.warn(`Erreur API Carto GPU ${endpoint}: ${errorMessage}`);

      return {
        success: false,
        error: `Erreur lors de l'appel à ${endpoint}: ${errorMessage}`,
        source: `API Carto GPU - ${endpoint}`,
        responseTimeMs: Date.now() - startTime,
      };
    }
  }
}
