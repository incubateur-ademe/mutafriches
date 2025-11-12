import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { Coordonnees } from "@mutafriches/shared-types";

import { ApiResponse } from "../shared/api-response.types";
import {
  ServicePublicServiceResponse,
  ServicePublicApiResponse,
  ServicePublicRecord,
  ServicePublicAdresseItem,
  ServicePublicPivotItem,
} from "./service-public.types";

/**
 * Adapter pour l'API Annuaire Service Public (version OpenDataSoft)
 * https://www.data.gouv.fr/dataservices/api-annuaire-de-ladministration-et-des-services-publics/
 * https://api-lannuaire.service-public.gouv.fr/api/explore/v2.1/console
 * Source officielle pour les coordonnées des mairies françaises
 */
@Injectable()
export class ServicePublicService {
  private readonly logger = new Logger(ServicePublicService.name);
  private readonly baseUrl =
    "https://api-lannuaire.service-public.gouv.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records";

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
      this.logger.debug(`Recherche mairie officielle: ${codeInsee}`);

      const params = {
        where: `code_insee_commune="${codeInsee}"`,
        limit: "20",
      };

      const url = `${this.baseUrl}?${new URLSearchParams(params).toString()}`;
      this.logger.debug(`URL appelée: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get<ServicePublicApiResponse>(this.baseUrl, { params }),
      );

      const data = response.data as ServicePublicApiResponse;

      this.logger.debug(
        `Résultats trouvés: ${data.total_count} total, ${data.results?.length || 0} retournés`,
      );

      if (!data.results || data.results.length === 0) {
        return {
          success: false,
          error: `Mairie non trouvée pour le code INSEE ${codeInsee}`,
          source: "API Service Public",
          responseTimeMs: Date.now() - startTime,
        };
      }

      const mairieRecord = this.findMairieRecord(data.results);

      if (!mairieRecord) {
        this.logger.warn(
          `Aucune mairie trouvée parmi ${data.results.length} résultats pour ${codeInsee}`,
        );
        return {
          success: false,
          error: `Mairie non trouvée pour le code INSEE ${codeInsee}`,
          source: "API Service Public",
          responseTimeMs: Date.now() - startTime,
        };
      }

      const coordonnees = this.extractCoordonnees(mairieRecord);

      if (!coordonnees) {
        return {
          success: false,
          error: `Coordonnées GPS non disponibles pour ${codeInsee}`,
          source: "API Service Public",
          responseTimeMs: Date.now() - startTime,
        };
      }

      const adresse = this.buildAdresse(mairieRecord);

      const responseTimeMs = Date.now() - startTime;

      this.logger.log(
        `Mairie ${mairieRecord.nom} (${codeInsee}): lat=${coordonnees.latitude.toFixed(5)}, lon=${coordonnees.longitude.toFixed(5)}`,
      );

      return {
        success: true,
        data: {
          codeInsee,
          nomCommune: mairieRecord.nom,
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

  /**
   * Trouve l'enregistrement de la mairie dans les résultats
   */
  private findMairieRecord(results: ServicePublicRecord[]): ServicePublicRecord | null {
    for (const record of results) {
      if (this.isMairieRecord(record)) {
        return record;
      }
    }

    return null;
  }

  /**
   * Vérifie si un enregistrement correspond à une mairie
   */
  private isMairieRecord(record: ServicePublicRecord): boolean {
    if (record.nom?.toLowerCase().includes("mairie")) {
      return true;
    }

    if (record.pivot) {
      try {
        const pivotData = JSON.parse(record.pivot) as ServicePublicPivotItem[];
        return pivotData.some((p) => p.type_service_local === "mairie");
      } catch (error) {
        this.logger.warn(`Impossible de parser pivot pour ${record.nom}`);
      }
    }

    return false;
  }

  /**
   * Extrait les coordonnées GPS depuis le champ adresse
   */
  private extractCoordonnees(record: ServicePublicRecord): Coordonnees | null {
    if (!record.adresse) {
      return null;
    }

    try {
      const adresses = JSON.parse(record.adresse) as ServicePublicAdresseItem[];

      const adressePhysique = adresses.find((a) => a.type_adresse === "Adresse");

      if (!adressePhysique) {
        return null;
      }

      const latitude = parseFloat(adressePhysique.latitude);
      const longitude = parseFloat(adressePhysique.longitude);

      if (isNaN(latitude) || isNaN(longitude)) {
        return null;
      }

      return { latitude, longitude };
    } catch (error) {
      this.logger.error(`Erreur parsing adresse pour ${record.nom}:`, (error as Error).message);
      return null;
    }
  }

  /**
   * Construit l'adresse complète à partir des données de l'API
   */
  private buildAdresse(record: ServicePublicRecord): string {
    if (!record.adresse) {
      return record.nom;
    }

    try {
      const adresses = JSON.parse(record.adresse) as ServicePublicAdresseItem[];
      const adressePhysique = adresses.find((a) => a.type_adresse === "Adresse");

      if (!adressePhysique) {
        return record.nom;
      }

      const parts: string[] = [record.nom];

      if (adressePhysique.numero_voie) {
        parts.push(adressePhysique.numero_voie);
      }
      if (adressePhysique.complement1) {
        parts.push(adressePhysique.complement1);
      }
      if (adressePhysique.complement2) {
        parts.push(adressePhysique.complement2);
      }
      if (adressePhysique.code_postal) {
        parts.push(adressePhysique.code_postal);
      }
      if (adressePhysique.nom_commune) {
        parts.push(adressePhysique.nom_commune);
      }

      return parts.join(", ");
    } catch (error) {
      this.logger.error(
        `Erreur construction adresse pour ${record.nom}:`,
        (error as Error).message,
      );
      return record.nom;
    }
  }
}
