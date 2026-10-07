import { Injectable, Logger } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DatabaseService } from "../../shared/database/database.service";
import { rawZae } from "../../shared/database/schemas/raw-zae.schema";

/**
 * Repository des zones d'activité économique (Cerema, Fusac), importées localement.
 *
 * Table alimentée par `pnpm db:zae:import`. L'appartenance se teste sur le centroïde du site
 * (ADR-0049) : une ZAE fait quelques hectares, un grand site à cheval sur sa limite peut donc
 * être classé hors ZAE.
 */
@Injectable()
export class ZaeRepository {
  private readonly logger = new Logger(ZaeRepository.name);

  /** Évite de répéter l'alerte "table vide" à chaque enrichissement */
  private tableVideSignalee = false;

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Indique si un point est dans une zone d'activité économique.
   *
   * @param latitude Latitude WGS84
   * @param longitude Longitude WGS84
   * @returns `true` dans une ZAE, `false` si la recherche n'a rien trouvé, ou `undefined` si la
   *          donnée est indisponible — lecture en échec, ou référentiel vide.
   */
  async estDansZae(latitude: number, longitude: number): Promise<boolean | undefined> {
    try {
      const rows = await this.databaseService.db.execute<{ trouve: number }>(sql`
        SELECT 1 AS trouve
        FROM raw_zae
        WHERE ST_Intersects(geom, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
        LIMIT 1
      `);

      if ((rows as unknown as Array<{ trouve: number }>).length > 0) {
        return true;
      }

      // Un référentiel vide ne peut pas se traduire par "hors ZAE" : le critère est scoré, et
      // un faux "Non" est un résultat plausible donc indétectable.
      return (await this.tableEstVide()) ? undefined : false;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Lecture raw_zae échouée pour ${latitude},${longitude} : ${err.message}`);
      return undefined;
    }
  }

  /** Une table vide signifie que l'import n'a jamais tourné sur cet environnement. */
  private async tableEstVide(): Promise<boolean> {
    const result = await this.databaseService.db
      .select({ total: sql<number>`count(*)::int` })
      .from(rawZae);

    const vide = (result[0]?.total ?? 0) === 0;

    if (vide && !this.tableVideSignalee) {
      this.tableVideSignalee = true;
      this.logger.error(
        "Référentiel raw_zae VIDE : le critère ZAE sera annoncé indisponible pour tous les " +
          "sites. Lancer `pnpm db:zae:import` sur cet environnement.",
      );
    }

    return vide;
  }
}
