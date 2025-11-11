import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { Coordonnees } from "@mutafriches/shared-types";

import { ApiResponse } from "../shared/api-response.types";
import { ServicePublicMairieResponse, ServicePublicServiceResponse } from "./service-public.types";

/**
 * Adapter pour l'API Annuaire Service Public
 * https://api.gouv.fr/documentation/api-annuaire-service-public
 *
 * Source officielle pour les coordonnées des mairies françaises
 */
@Injectable()
export class ServicePublicService {
  private readonly logger = new Logger(ServicePublicService.name);
  private readonly baseUrl = "https://etablissements-publics.api.gouv.fr/v3";

  constructor(private readonly httpService: HttpService) {}

  /**
   * Récupère les coordonnées GPS officielles de la mairie d'une commune
   *
   * @param codeInsee - Code INSEE de la commune (5 caractères)
   * @returns Coordonnées GPS précises de la mairie
   */
  async getMairieCoordonnees(
    codeInsee: string,
  ): Promise<ApiResponse<ServicePublicServiceResponse>> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}/communes/${codeInsee}/mairie`;

      this.logger.debug(`Recherche mairie officielle: ${codeInsee}`);

      const response = await firstValueFrom(this.httpService.get<ServicePublicMairieResponse>(url));

      const data = response.data;

      if (!data.features || data.features.length === 0) {
        return {
          success: false,
          error: `Mairie non trouvée pour le code INSEE ${codeInsee}`,
          source: "API Service Public",
          responseTimeMs: Date.now() - startTime,
        };
      }

      const feature = data.features[0];
      const properties = feature.properties;

      // Extraire les coordonnées du pivot (format GeoJSON)
      if (!feature.geometry || !feature.geometry.coordinates) {
        return {
          success: false,
          error: `Coordonnées GPS non disponibles pour ${codeInsee}`,
          source: "API Service Public",
          responseTimeMs: Date.now() - startTime,
        };
      }

      const [longitude, latitude] = feature.geometry.coordinates as [number, number];

      if (isNaN(latitude) || isNaN(longitude)) {
        return {
          success: false,
          error: "Coordonnées GPS invalides",
          source: "API Service Public",
          responseTimeMs: Date.now() - startTime,
        };
      }

      const coordonnees: Coordonnees = { latitude, longitude };

      // Construire l'adresse complète
      const adresseObj = properties.adresses?.find((a) => a.type === "géopostale");
      const adresse = adresseObj
        ? `${properties.nom}, ${adresseObj.lignes.join(" ")}, ${adresseObj.code_postal}`
        : properties.nom;

      const responseTimeMs = Date.now() - startTime;

      this.logger.log(
        `Mairie ${properties.nom} (${codeInsee}): lat=${latitude.toFixed(5)}, lon=${longitude.toFixed(5)}`,
      );

      return {
        success: true,
        data: {
          codeInsee,
          nomCommune: properties.nom,
          coordonnees,
          adresse,
        },
        source: "API Service Public",
        responseTimeMs,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;

      if ((error as any).response?.status === 404) {
        this.logger.warn(`Mairie non trouvée pour ${codeInsee} (404)`);
        return {
          success: false,
          error: `Mairie non trouvée pour le code INSEE ${codeInsee}`,
          source: "API Service Public",
          responseTimeMs,
        };
      }

      this.logger.error(`Erreur API Service Public pour ${codeInsee}:`, (error as Error).stack);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur API Service Public",
        source: "API Service Public",
        responseTimeMs,
      };
    }
  }
}
