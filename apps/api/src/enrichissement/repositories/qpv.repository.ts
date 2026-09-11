import { Injectable, Logger } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DatabaseService } from "../../shared/database/database.service";
import { rawQpv } from "../../shared/database/schemas/raw-qpv.schema";

/**
 * Quartier prioritaire de la politique de la ville contenant le site.
 */
export interface QpvData {
  /** Code officiel du quartier au référencement 2024 (format QN00101M) */
  codeQpv: string;
  /** Libellé du quartier */
  nomQpv: string;
}

/**
 * Repository des périmètres QPV (ANCT), importés localement.
 *
 * Table alimentée par `pnpm db:qpv:import`. Les périmètres sont infra-communaux et ne couvrent
 * que 3,8 % de la surface des communes concernées : l'appartenance se teste spatialement sur
 * le centroïde du site, jamais par code INSEE (ADR-0037).
 */
@Injectable()
export class QpvRepository {
  private readonly logger = new Logger(QpvRepository.name);

  /** Évite de répéter l'alerte "table vide" à chaque enrichissement */
  private tableVideSignalee = false;

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Recherche le quartier prioritaire contenant un point.
   *
   * @param latitude Latitude WGS84
   * @param longitude Longitude WGS84
   * @returns Le quartier, `null` si le site n'est dans aucun QPV (recherche effectuée, aucun
   *          résultat), ou `undefined` si la donnée est indisponible — lecture en échec, ou
   *          référentiel vide.
   */
  async findQuartierContenant(
    latitude: number,
    longitude: number,
  ): Promise<QpvData | null | undefined> {
    try {
      const rows = await this.databaseService.db.execute<{
        code_qpv: string;
        nom_qpv: string;
      }>(sql`
        SELECT code_qpv, nom_qpv
        FROM raw_qpv
        WHERE ST_Intersects(geom, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
        LIMIT 1
      `);

      const row = (rows as unknown as Array<{ code_qpv: string; nom_qpv: string }>)[0];
      if (!row) {
        // Contrairement à l'ICU, un référentiel vide ne peut pas se traduire par "non concerné" :
        // le critère est scoré, et un faux "Non" est un résultat plausible donc indétectable.
        return (await this.tableEstVide()) ? undefined : null;
      }

      return { codeQpv: row.code_qpv, nomQpv: row.nom_qpv };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Lecture raw_qpv échouée pour ${latitude},${longitude} : ${err.message}`);
      return undefined;
    }
  }

  /**
   * Une table vide signifie que l'import n'a jamais tourné sur cet environnement. Sans cette
   * vérification, 100 % des sites seraient scorés "hors QPV" alors que la donnée n'existe
   * simplement pas en base.
   */
  private async tableEstVide(): Promise<boolean> {
    const result = await this.databaseService.db
      .select({ total: sql<number>`count(*)::int` })
      .from(rawQpv);

    const vide = (result[0]?.total ?? 0) === 0;

    if (vide && !this.tableVideSignalee) {
      this.tableVideSignalee = true;
      this.logger.error(
        "Référentiel raw_qpv VIDE : le critère QPV sera annoncé indisponible pour tous les " +
          "sites. Lancer `pnpm db:qpv:import` sur cet environnement.",
      );
    }

    return vide;
  }
}
