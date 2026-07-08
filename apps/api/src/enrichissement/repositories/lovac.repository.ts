import { Injectable, Logger } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DatabaseService } from "../../shared/database/database.service";
import { rawLovac } from "../../shared/database/schemas/raw-lovac.schema";

/**
 * Donnees LOVAC d'une commune, lues depuis le referentiel local raw_lovac.
 */
export interface LovacCommuneData {
  codeInsee: string;
  commune: string | null;
  nombreLogementsTotal: number | null;
  nombreLogementsVacants: number | null;
  nombreLogementsVacantsPlus2ans: number | null;
  millesime: number;
}

/**
 * Repository pour les donnees LOVAC (logements vacants) importees localement.
 *
 * Remplace l'appel live a l'API tabulaire data.gouv.fr (rate-limitee sous charge).
 * Table alimentee par `pnpm db:lovac:import`.
 */
@Injectable()
export class LovacRepository {
  private readonly logger = new Logger(LovacRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Recherche une commune par code INSEE (prioritaire), sinon par nom exact.
   *
   * @returns Les donnees LOVAC de la commune, ou null si non trouvee
   */
  async findByCommune(params: {
    codeInsee?: string;
    nomCommune?: string;
  }): Promise<LovacCommuneData | null> {
    try {
      const rows = params.codeInsee
        ? await this.databaseService.db
            .select()
            .from(rawLovac)
            .where(eq(rawLovac.codeInsee, params.codeInsee))
            .limit(1)
        : params.nomCommune
          ? await this.databaseService.db
              .select()
              .from(rawLovac)
              .where(eq(rawLovac.nom, params.nomCommune))
              .limit(1)
          : [];

      const row = rows[0];
      if (!row) return null;

      return {
        codeInsee: row.codeInsee,
        commune: row.nom,
        nombreLogementsTotal: row.nombreLogementsTotal,
        nombreLogementsVacants: row.nombreLogementsVacants,
        nombreLogementsVacantsPlus2ans: row.nombreLogementsVacantsPlus2ans,
        millesime: row.millesime,
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(
        `Lecture raw_lovac echouee pour ${params.codeInsee ?? params.nomCommune} : ${err.message}`,
      );
      return null;
    }
  }
}
