import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { ZonageAbcLogement } from "@mutafriches/shared-types";
import { firstValueFrom } from "rxjs";
import {
  DatagouvZonageAbcResponse,
  ZonageAbcCommuneRow,
  ZonageAbcData,
} from "./datagouv-zonage-abc.types";

// Le nom de la colonne porte le millésime du zonage et change à chaque publication
// ("Zonage en vigueur depuis le 5 septembre 2025", puis "Zonage ABC en vigueur depuis
// le 26 juin 2026") : on la résout par motif pour survivre au remillésimage annuel.
export const MOTIF_COLONNE_ZONAGE = /zonage.*en\s+vigueur/i;

// Colonnes de contexte, jamais porteuses de la valeur de zonage
const COLONNES_IGNOREES = ["CODGEO", "DEP", "LIBGEO", "__id"];

@Injectable()
export class DatagouvZonageAbcService {
  private readonly logger = new Logger(DatagouvZonageAbcService.name);
  private readonly baseUrl = "https://tabular-api.data.gouv.fr/api";
  private readonly resourceId = "13f7282b-8a25-43ab-9713-8bb4e476df55";

  constructor(private readonly httpService: HttpService) {}

  /**
   * Récupère le zonage ABC d'une commune.
   *
   * - `ZonageAbcData` : zonage trouvé
   * - `null` : commune absente du référentiel (recherche effectuée, aucun résultat)
   * - `undefined` : donnée indisponible (erreur technique ou schéma inattendu)
   */
  async getZonageByCommune(codeInsee: string): Promise<ZonageAbcData | null | undefined> {
    try {
      const url = this.buildUrl(codeInsee);

      this.logger.debug(`Appel API data.gouv.fr Zonage ABC: ${codeInsee}`);

      const response = await firstValueFrom(
        this.httpService.get<DatagouvZonageAbcResponse>(url, { timeout: 10000 }),
      );

      const apiResponse = response.data as DatagouvZonageAbcResponse;

      if (!apiResponse.data || apiResponse.data.length === 0) {
        this.logger.debug(`Commune absente du référentiel Zonage ABC: ${codeInsee}`);
        return null;
      }

      const row = apiResponse.data[0];
      return this.transformRow(row);
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération du Zonage ABC pour ${codeInsee}:`, error);
      return undefined;
    }
  }

  private buildUrl(codeInsee: string): string {
    const url = new URL(`${this.baseUrl}/resources/${this.resourceId}/data/`);
    url.searchParams.append("CODGEO__exact", codeInsee);
    url.searchParams.append("page", "1");
    url.searchParams.append("page_size", "1");
    return url.toString();
  }

  private transformRow(row: ZonageAbcCommuneRow): ZonageAbcData | undefined {
    const colonne = this.resoudreColonneZonage(row);

    if (!colonne) {
      this.logger.error(
        `Schéma inattendu du dataset Zonage ABC : aucune colonne ne correspond à ` +
          `${MOTIF_COLONNE_ZONAGE.source} (colonnes reçues : ${Object.keys(row).join(", ")})`,
      );
      return undefined;
    }

    const rawZonage = row[colonne];
    const zonage = this.normaliserZonage(rawZonage);

    if (!zonage) {
      this.logger.warn(
        `Valeur de zonage ABC inconnue: "${String(rawZonage)}" (colonne "${colonne}") ` +
          `pour ${row.CODGEO}`,
      );
      return undefined;
    }

    return {
      codeInsee: row.CODGEO,
      commune: row.LIBGEO,
      zonage,
    };
  }

  private resoudreColonneZonage(row: ZonageAbcCommuneRow): string | undefined {
    return Object.keys(row).find(
      (cle) => !COLONNES_IGNOREES.includes(cle) && MOTIF_COLONNE_ZONAGE.test(cle),
    );
  }

  private normaliserZonage(valeur: unknown): ZonageAbcLogement | null {
    if (typeof valeur !== "string" || !valeur) return null;

    // Le dataset utilise "Abis" (sans espace), mais on tolère les variantes
    // "A bis", "a-bis", etc. en supprimant espaces et tirets internes.
    const normalise = valeur
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "");

    switch (normalise) {
      case "abis":
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
