import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import {
  DatagouvLovacResponse,
  LovacCommuneRow,
  LovacData,
  LovacQueryParams,
} from "./datagouv-lovac.types";

/**
 * Service d'accès à l'API tabulaire data.gouv.fr pour les données LOVAC
 * (Logements vacants du parc privé)
 *
 * Documentation API :
 * https://www.data.gouv.fr/dataservices/api-tabulaire-data-gouv-fr-beta/
 *
 * Dataset LOVAC :
 * https://www.data.gouv.fr/datasets/logements-vacants-du-parc-prive-en-france-et-par-commune-departement-region/
 */
@Injectable()
export class DatagouvLovacService {
  private readonly logger = new Logger(DatagouvLovacService.name);
  private readonly baseUrl = "https://tabular-api.data.gouv.fr/api";
  private readonly resourceId = "2e0417b4-902d-4c60-90e7-bf5df148cb87"; // ID de la ressource LOVAC communes

  constructor(private readonly httpService: HttpService) {}

  /**
   * Récupère les données LOVAC pour une commune
   *
   * @param params - Paramètres de recherche (code INSEE ou nom de commune)
   * @returns Données LOVAC enrichies ou null si non trouvé
   */
  async getLovacByCommune(params: LovacQueryParams): Promise<LovacData | null> {
    try {
      const url = this.buildUrl(params);

      this.logger.debug(`Appel API data.gouv.fr LOVAC: ${params.codeInsee || params.nomCommune}`);

      const response = await firstValueFrom(this.httpService.get<DatagouvLovacResponse>(url));

      const apiResponse = response.data as DatagouvLovacResponse;

      if (!apiResponse.data || apiResponse.data.length === 0) {
        this.logger.warn(
          `Aucune donnee LOVAC trouvee pour: ${params.codeInsee || params.nomCommune}`,
        );
        return null;
      }

      // Prendre la première ligne (résultat exact)
      const row = apiResponse.data[0] as LovacCommuneRow;

      return this.transformRowToLovacData(row);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la recuperation des donnees LOVAC pour ${params.codeInsee || params.nomCommune}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Construit l'URL de requête avec les paramètres de filtrage
   */
  private buildUrl(params: LovacQueryParams): string {
    const url = new URL(`${this.baseUrl}/resources/${this.resourceId}/data/`);

    // Filtrage par code INSEE (prioritaire)
    if (params.codeInsee) {
      url.searchParams.append("CODGEO_25__exact", params.codeInsee);
    }
    // Sinon filtrage par nom de commune
    else if (params.nomCommune) {
      url.searchParams.append("LIBGEO_25__exact", params.nomCommune);
    }

    // Pagination (on ne prend que la première page avec 1 résultat)
    url.searchParams.append("page", String(params.page || 1));
    url.searchParams.append("page_size", String(params.page_size || 1));

    return url.toString();
  }

  /**
   * Transforme une ligne brute de l'API en données LOVAC enrichies
   */
  private transformRowToLovacData(row: LovacCommuneRow): LovacData {
    // Déterminer le millésime le plus récent disponible pour les logements totaux et vacants
    const millesime = 2025; // Millésime le plus récent dans les données

    // Récupérer les valeurs (les données sont en string, il faut les parser)
    const totalLogements = this.parseNumber(row.pp_total_24); // 2024 est le plus récent pour total
    const logementsVacants = this.parseNumber(row.pp_vacant_25); // 2025 pour vacants
    const logementsVacantsPlus2ans = this.parseNumber(row.pp_vacant_plus_2ans_25);

    return {
      codeInsee: row.CODGEO_25,
      commune: row.LIBGEO_25,
      departement: row.LIB_DEP,
      region: row.LIB_REG,
      nombreLogementsTotal: totalLogements,
      nombreLogementsVacants: logementsVacants,
      tauxLogementsVacants: null, // Le calcul sera fait par le calculator dans le service
      nombreLogementsVacantsPlus2ans: logementsVacantsPlus2ans,
      millesime,
    };
  }

  /**
   * Parse une valeur string en number
   * Gère les cas "s" (secrétisé) et valeurs vides
   */
  private parseNumber(value: string | undefined): number | null {
    if (!value || value === "" || value.toLowerCase() === "s") {
      return null;
    }

    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
}
