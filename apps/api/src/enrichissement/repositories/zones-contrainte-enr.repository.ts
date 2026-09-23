import { Injectable, Logger } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DatabaseService } from "../../shared/database/database.service";
import { rawZonesContrainteEnr } from "../../shared/database/schemas/raw-zones-contrainte-enr.schema";

/** Statut Enedis de la zone de poste source contenant le site */
export type StatutZoneContrainteEnr =
  "TRES_FAVORABLE" | "FAVORABLE" | "EN_TENSION" | "SATUREE" | "ELD";

/**
 * Repository des zones de contrainte pour raccorder des projets EnR (Enedis/RTE), importées
 * localement par `pnpm db:zones-contrainte-enr:import` (ADR-0046).
 */
@Injectable()
export class ZonesContrainteEnrRepository {
  private readonly logger = new Logger(ZonesContrainteEnrRepository.name);

  /** Évite de répéter l'alerte "table vide" à chaque enrichissement */
  private tableVideSignalee = false;

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Statut de la zone contenant le point : `null` si aucune zone ne le contient (hors
   * périmètre Enedis), `undefined` si la lecture échoue ou si le référentiel est vide.
   */
  async findStatutZoneContenant(
    latitude: number,
    longitude: number,
  ): Promise<StatutZoneContrainteEnr | null | undefined> {
    try {
      const rows = await this.databaseService.db.execute<{ statut: string }>(sql`
        SELECT statut
        FROM raw_zones_contrainte_enr
        WHERE ST_Intersects(geom, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
        LIMIT 1
      `);

      const row = (rows as unknown as Array<{ statut: string }>)[0];
      if (!row) {
        return (await this.tableEstVide()) ? undefined : null;
      }

      return row.statut as StatutZoneContrainteEnr;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(
        `Lecture raw_zones_contrainte_enr échouée pour ${latitude},${longitude} : ${err.message}`,
      );
      return undefined;
    }
  }

  private async tableEstVide(): Promise<boolean> {
    const result = await this.databaseService.db
      .select({ total: sql<number>`count(*)::int` })
      .from(rawZonesContrainteEnr);

    const vide = (result[0]?.total ?? 0) === 0;

    if (vide && !this.tableVideSignalee) {
      this.tableVideSignalee = true;
      this.logger.error(
        "Référentiel raw_zones_contrainte_enr VIDE : la saturation réseau EnR sera annoncée " +
          "indisponible pour tous les sites. Lancer `pnpm db:zones-contrainte-enr:import`.",
      );
    }

    return vide;
  }
}
