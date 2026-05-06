import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { ZonageAbcLogement } from "@mutafriches/shared-types";
import { firstValueFrom } from "rxjs";
import {
  DatagouvZonageAbcResponse,
  ZonageAbcCommuneRow,
  ZonageAbcData,
} from "./datagouv-zonage-abc.types";

const ZONAGE_COLUMN = "Zonage en vigueur depuis le 5 septembre 2025";

@Injectable()
export class DatagouvZonageAbcService {
  private readonly logger = new Logger(DatagouvZonageAbcService.name);
  private readonly baseUrl = "https://tabular-api.data.gouv.fr/api";
  private readonly resourceId = "13f7282b-8a25-43ab-9713-8bb4e476df55";

  constructor(private readonly httpService: HttpService) {}

  async getZonageByCommune(codeInsee: string): Promise<ZonageAbcData | null> {
    try {
      const url = this.buildUrl(codeInsee);

      this.logger.debug(`Appel API data.gouv.fr Zonage ABC: ${codeInsee}`);

      const response = await firstValueFrom(
        this.httpService.get<DatagouvZonageAbcResponse>(url, { timeout: 10000 }),
      );

      const apiResponse = response.data as DatagouvZonageAbcResponse;

      if (!apiResponse.data || apiResponse.data.length === 0) {
        this.logger.warn(`Aucune donnée Zonage ABC trouvée pour: ${codeInsee}`);
        return null;
      }

      const row = apiResponse.data[0] as ZonageAbcCommuneRow;
      return this.transformRow(row);
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération du Zonage ABC pour ${codeInsee}:`, error);
      return null;
    }
  }

  private buildUrl(codeInsee: string): string {
    const url = new URL(`${this.baseUrl}/resources/${this.resourceId}/data/`);
    url.searchParams.append("CODGEO__exact", codeInsee);
    url.searchParams.append("page", "1");
    url.searchParams.append("page_size", "1");
    return url.toString();
  }

  private transformRow(row: ZonageAbcCommuneRow): ZonageAbcData | null {
    const rawZonage = row[ZONAGE_COLUMN];
    const zonage = this.normaliserZonage(rawZonage);

    if (!zonage) {
      this.logger.warn(`Valeur de zonage ABC inconnue: "${rawZonage}" pour ${row.CODGEO}`);
      return null;
    }

    return {
      codeInsee: row.CODGEO,
      commune: row.LIBGEO,
      zonage,
    };
  }

  private normaliserZonage(valeur: string | undefined): ZonageAbcLogement | null {
    if (!valeur) return null;

    const normalise = valeur.trim().toLowerCase();

    switch (normalise) {
      case "a bis":
        return ZonageAbcLogement.ABIS;
      case "a":
        return ZonageAbcLogement.A;
      case "b1":
        return ZonageAbcLogement.B1;
      case "b2":
        return ZonageAbcLogement.B2;
      case "c":
        return ZonageAbcLogement.C;
      default:
        return null;
    }
  }
}
