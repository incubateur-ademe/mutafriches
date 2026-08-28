import { Injectable, Logger } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { ZonageAbcLogement } from "@mutafriches/shared-types";
import { DatabaseService } from "../../shared/database/database.service";
import { rawZonageAbc } from "../../shared/database/schemas/raw-zonage-abc.schema";

/**
 * Zonage ABC d'une commune, lu depuis le referentiel local raw_zonage_abc.
 */
export interface ZonageAbcCommuneData {
  codeInsee: string;
  commune: string | null;
  zonage: ZonageAbcLogement;
  millesime: string | null;
}

/**
 * Repository pour le zonage ABC (tension du marche du logement) importe localement.
 *
 * Remplace l'appel live a l'API tabulaire data.gouv.fr, rate-limitee sous charge (ADR-0032).
 * Table alimentee par `pnpm db:zonage-abc:import`.
 */
@Injectable()
export class ZonageAbcRepository {
  private readonly logger = new Logger(ZonageAbcRepository.name);

  /** Evite de repeter l'alerte "table vide" a chaque enrichissement */
  private tableVideSignalee = false;

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Recherche le zonage d'une commune par code INSEE.
   *
   * @returns Le zonage, `null` si la commune est absente du referentiel
   *          (recherche effectuee, aucun resultat), ou `undefined` si la lecture
   *          a echoue techniquement (donnee indisponible).
   */
  async findByCodeInsee(codeInsee: string): Promise<ZonageAbcCommuneData | null | undefined> {
    try {
      const rows = await this.databaseService.db
        .select()
        .from(rawZonageAbc)
        .where(eq(rawZonageAbc.codeInsee, codeInsee))
        .limit(1);

      const row = rows[0];
      if (!row) {
        await this.alerterSiTableVide();
        return null;
      }

      return {
        codeInsee: row.codeInsee,
        commune: row.nom,
        zonage: row.zonage as ZonageAbcLogement,
        millesime: row.millesime,
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Lecture raw_zonage_abc echouee pour ${codeInsee} : ${err.message}`);
      return undefined;
    }
  }

  /**
   * Une table vide signifie que l'import n'a jamais tourne sur cet environnement.
   * Sans cette alerte, le critere tomberait silencieusement en "commune absente"
   * pour 100 % des sites et la fiabilite baisserait sans que personne ne le voie.
   */
  private async alerterSiTableVide(): Promise<void> {
    if (this.tableVideSignalee) return;

    const result = await this.databaseService.db
      .select({ total: sql<number>`count(*)::int` })
      .from(rawZonageAbc);

    if ((result[0]?.total ?? 0) === 0) {
      this.tableVideSignalee = true;
      this.logger.error(
        "Referentiel raw_zonage_abc VIDE : le critere zonageAbcLogement sera manquant pour " +
          "tous les sites. Lancer `pnpm db:zonage-abc:import` sur cet environnement.",
      );
    }
  }
}
