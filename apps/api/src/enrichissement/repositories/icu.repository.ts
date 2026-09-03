import { Injectable, Logger } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DatabaseService } from "../../shared/database/database.service";
import { rawIcu } from "../../shared/database/schemas/raw-icu.schema";

/**
 * Zone d'îlot de chaleur urbain contenant le site.
 */
export interface IcuZoneData {
  /** Identifiant de la zone d'étude (IRIS groupé) */
  codeGiris: string;
  /** Intensité maximale absolue de l'îlot de chaleur urbain, en °C */
  iuhi: number;
}

/**
 * Repository pour la cartographie des îlots de chaleur urbain (CSTB), importée localement.
 *
 * Table alimentée par `pnpm db:icu:import`. La couverture ne suit pas les frontières
 * communales : l'appartenance se teste spatialement, jamais par code INSEE (ADR-0034).
 */
@Injectable()
export class IcuRepository {
  private readonly logger = new Logger(IcuRepository.name);

  /** Évite de répéter l'alerte "table vide" à chaque enrichissement */
  private tableVideSignalee = false;

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Recherche la zone ICU contenant un point.
   *
   * @param latitude Latitude WGS84
   * @param longitude Longitude WGS84
   * @returns La zone, `null` si le site est hors du périmètre d'étude (recherche
   *          effectuée, aucun résultat), ou `undefined` si la lecture a échoué
   *          techniquement (donnée indisponible).
   */
  async findZoneContenant(
    latitude: number,
    longitude: number,
  ): Promise<IcuZoneData | null | undefined> {
    try {
      const rows = await this.databaseService.db.execute<{
        code_giris: string;
        iuhi: number;
      }>(sql`
        SELECT code_giris, iuhi
        FROM raw_icu
        WHERE ST_Intersects(geom, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
        ORDER BY iuhi DESC
        LIMIT 1
      `);

      const row = (rows as unknown as Array<{ code_giris: string; iuhi: number }>)[0];
      if (!row) {
        await this.alerterSiTableVide();
        return null;
      }

      return { codeGiris: row.code_giris, iuhi: Number(row.iuhi) };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Lecture raw_icu échouée pour ${latitude},${longitude} : ${err.message}`);
      return undefined;
    }
  }

  /**
   * Une table vide signifie que l'import n'a jamais tourné sur cet environnement.
   * Sans cette alerte, 100 % des sites seraient annoncés « hors périmètre d'étude »
   * alors que la donnée existe simplement pas en base.
   */
  private async alerterSiTableVide(): Promise<void> {
    if (this.tableVideSignalee) return;

    const result = await this.databaseService.db
      .select({ total: sql<number>`count(*)::int` })
      .from(rawIcu);

    if ((result[0]?.total ?? 0) === 0) {
      this.tableVideSignalee = true;
      this.logger.error(
        "Référentiel raw_icu VIDE : tous les sites seront annoncés hors périmètre d'étude. " +
          "Lancer `pnpm db:icu:import` sur cet environnement.",
      );
    }
  }
}
