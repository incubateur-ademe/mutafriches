import { Injectable, Logger } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DatabaseService } from "../../shared/database/database.service";
import { rawIcu } from "../../shared/database/schemas/raw-icu.schema";

/**
 * Tolérance de bord, en mètres : un site à moins de cette distance d'une zone est rattaché
 * à celle-ci. Ordre de grandeur du segment médian des polygones importés (~114 m), qui sont
 * simplifiés et dont les limites suivent des mailles IRIS, pas le phénomène thermique.
 */
export const TOLERANCE_ZONE_ICU_M = 150;

/**
 * Pré-filtre en degrés, sur `geom` : seul lui exploite l'index GIST, le second filtre en
 * geography restant exact mais non indexé (114 ms de scan séquentiel sans ce garde). Choisi
 * comme sur-ensemble strict de la tolérance : 0,003° vaut au moins 210 m en longitude
 * jusqu'au nord de la métropole, et 333 m en latitude.
 */
const PRE_FILTRE_DEGRES = 0.003;

/**
 * Zone d'îlot de chaleur urbain rattachée au site.
 */
export interface IcuZoneData {
  /** Identifiant de la zone d'étude (IRIS groupé) */
  codeGiris: string;
  /** Intensité maximale absolue de l'îlot de chaleur urbain, en °C */
  iuhi: number;
  /** Distance du site à la zone, en mètres (0 si le site est à l'intérieur) */
  distanceM: number;
}

/**
 * Repository pour la cartographie des îlots de chaleur urbain (CSTB), importée localement.
 *
 * Table alimentée par `pnpm db:icu:import`. Les zones ne couvrent que l'enveloppe urbaine
 * dense des communes étudiées : l'exposition se teste spatialement, le périmètre d'étude par
 * code INSEE (ADR-0034, ADR-0037).
 */
@Injectable()
export class IcuRepository {
  private readonly logger = new Logger(IcuRepository.name);

  /** Évite de répéter l'alerte "table vide" à chaque enrichissement */
  private tableVideSignalee = false;

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Recherche la zone ICU contenant le point, ou la plus proche dans la tolérance de bord.
   *
   * Filtrage en deux temps : emprise indexée en degrés, puis distance géodésique exacte.
   *
   * @param latitude Latitude WGS84
   * @param longitude Longitude WGS84
   * @returns La zone, `null` si aucune zone n'est assez proche (recherche effectuée, aucun
   *          résultat), ou `undefined` si la lecture a échoué techniquement.
   */
  async findZoneProche(
    latitude: number,
    longitude: number,
  ): Promise<IcuZoneData | null | undefined> {
    try {
      const rows = await this.databaseService.db.execute<{
        code_giris: string;
        iuhi: number;
        distance_m: number;
      }>(sql`
        SELECT
          code_giris,
          iuhi,
          ST_Distance(
            geom::geography,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
          ) AS distance_m
        FROM raw_icu
        WHERE ST_DWithin(
          geom,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
          ${PRE_FILTRE_DEGRES}
        )
        AND ST_DWithin(
          geom::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${TOLERANCE_ZONE_ICU_M}
        )
        ORDER BY distance_m ASC, iuhi DESC
        LIMIT 1
      `);

      const row = (
        rows as unknown as Array<{ code_giris: string; iuhi: number; distance_m: number }>
      )[0];
      if (!row) {
        await this.alerterSiTableVide();
        return null;
      }

      return {
        codeGiris: row.code_giris,
        iuhi: Number(row.iuhi),
        distanceM: Number(row.distance_m),
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Lecture raw_icu échouée pour ${latitude},${longitude} : ${err.message}`);
      return undefined;
    }
  }

  /**
   * Indique si la commune fait partie du périmètre d'étude du CSTB.
   *
   * Les zones ne couvrent que l'enveloppe urbaine dense d'une commune étudiée : un site sans
   * zone proche peut donc être dans une commune cartographiée. Le code INSEE est le préfixe
   * du code IRIS groupé.
   *
   * @returns `undefined` si la lecture a échoué techniquement.
   */
  async communeEstCouverte(codeInsee: string): Promise<boolean | undefined> {
    try {
      const rows = await this.databaseService.db.execute<{ couverte: boolean }>(sql`
        SELECT EXISTS (
          SELECT 1 FROM raw_icu WHERE LEFT(code_giris, 5) = ${codeInsee}
        ) AS couverte
      `);

      return (rows as unknown as Array<{ couverte: boolean }>)[0]?.couverte === true;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Lecture raw_icu échouée pour la commune ${codeInsee} : ${err.message}`);
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
