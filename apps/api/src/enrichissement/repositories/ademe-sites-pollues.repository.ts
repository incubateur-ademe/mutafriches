import { Injectable, Logger } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DatabaseService } from "../../shared/database/database.service";

/**
 * Repository pour interroger les sites pollues ADEME
 *
 * Permet de determiner si une parcelle est situee sur ou a proximite
 * d'un site ayant fait l'objet d'une intervention ADEME pour pollution.
 */
@Injectable()
export class AdemeSitesPolluesRepository {
  private readonly logger = new Logger(AdemeSitesPolluesRepository.name);

  /** Rayon de recherche par defaut en metres */
  private readonly DEFAULT_RAYON_METRES = 500;

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Verifie si un site est reference comme potentiellement pollue
   *
   * Strategie de matching:
   * 1. Match spatial: le point est a moins de 100m d'un site ADEME
   * 2. Match par code INSEE: le site est dans la meme commune
   *
   * @param latitude Latitude WGS84
   * @param longitude Longitude WGS84
   * @param codeInsee Code INSEE de la commune (optionnel)
   * @returns true si le site est reference comme potentiellement pollue
   */
  async isSiteReferencePollue(
    latitude: number,
    longitude: number,
    codeInsee?: string,
  ): Promise<boolean> {
    try {
      // Recherche spatiale: site ADEME a moins de 100m
      const result = await this.databaseService.db.execute<{ found: boolean }>(sql`
        SELECT EXISTS(
          SELECT 1
          FROM raw_ademe_sites_pollues
          WHERE ST_DWithin(
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
            ${this.DEFAULT_RAYON_METRES}
          )
        ) as found
      `);

      const found = result[0]?.found === true;

      if (found) {
        this.logger.debug(
          `Site ADEME trouve a proximite (< ${this.DEFAULT_RAYON_METRES}m) pour lat=${latitude}, lon=${longitude}`,
        );
        return true;
      }

      this.logger.debug(
        `Aucun site ADEME trouve a proximite pour lat=${latitude}, lon=${longitude}${codeInsee ? `, commune=${codeInsee}` : ""}`,
      );

      return false;
    } catch (error) {
      this.logger.error("Erreur lors de la recherche de site ADEME:", error);
      throw error;
    }
  }

  /**
   * Trouve le site ADEME le plus proche d'une coordonnee
   *
   * @param latitude Latitude WGS84
   * @param longitude Longitude WGS84
   * @param rayonMetres Rayon de recherche en metres
   * @returns Informations sur le site le plus proche, ou null si aucun trouve
   */
  async findSitePlusProche(
    latitude: number,
    longitude: number,
    rayonMetres: number = this.DEFAULT_RAYON_METRES,
  ): Promise<{
    nomSite: string;
    distance: number;
    codeInsee: string;
  } | null> {
    try {
      const result = await this.databaseService.db.execute<{
        nom_site: string;
        distance: number;
        code_insee: string;
      }>(sql`
        SELECT
          nom_site,
          code_insee,
          ST_Distance(
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
          ) as distance
        FROM raw_ademe_sites_pollues
        WHERE ST_DWithin(
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${rayonMetres}
        )
        ORDER BY
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography <->
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        LIMIT 1
      `);

      if (result.length === 0) {
        return null;
      }

      return {
        nomSite: result[0].nom_site,
        distance: result[0].distance,
        codeInsee: result[0].code_insee,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la recherche du site ADEME le plus proche:", error);
      throw error;
    }
  }

  /**
   * Compte le nombre total de sites ADEME dans la base
   */
  async count(): Promise<number> {
    const result = await this.databaseService.db.execute<{ count: string }>(sql`
      SELECT COUNT(*) as count FROM raw_ademe_sites_pollues
    `);
    return parseInt(result[0].count, 10);
  }
}
