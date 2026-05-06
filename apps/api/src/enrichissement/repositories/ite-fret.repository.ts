import { Injectable, Logger } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DatabaseService } from "../../shared/database/database.service";

/**
 * Rayon de recherche par défaut en mètres pour la recherche d'ITE
 *
 * 2 km est suffisant : on n'a besoin de discriminer que les ITE à moins d'1 km
 * (catégorisées MOINS_1KM_BON_ETAT / MOINS_1KM_MAUVAIS_ETAT) des autres (PLUS_1KM).
 */
export const RAYON_RECHERCHE_ITE_M = 2000;

export interface IteProcheResult {
  nom: string;
  /** Distance en mètres */
  distance: number;
  /** État normalisé : "bon" | "mauvais" | null */
  etat: string | null;
}

/**
 * Repository pour interroger les Installations Terminales Embranchées (ITE) fret
 *
 * Source : Cerema - Base ITE 3000
 * Permet de déterminer si une parcelle est à proximité d'un terminal de chargement
 * industriel ferroviaire et de récupérer son état.
 */
@Injectable()
export class IteFretRepository {
  private readonly logger = new Logger(IteFretRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Trouve l'ITE la plus proche d'une coordonnée, dans un rayon donné.
   *
   * @param latitude Latitude WGS84
   * @param longitude Longitude WGS84
   * @param rayonMetres Rayon de recherche en mètres (par défaut 2000m)
   * @returns Informations sur l'ITE la plus proche, ou null si aucune trouvée dans le rayon
   */
  async findIteProche(
    latitude: number,
    longitude: number,
    rayonMetres: number = RAYON_RECHERCHE_ITE_M,
  ): Promise<IteProcheResult | null> {
    try {
      const result = await this.databaseService.db.execute<{
        nom: string;
        distance: number;
        etat: string | null;
      }>(sql`
        SELECT
          nom,
          etat,
          ST_Distance(
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
          ) as distance
        FROM raw_ite_fret
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
        nom: result[0].nom,
        distance: result[0].distance,
        etat: result[0].etat,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la recherche de l'ITE la plus proche:", error);
      throw error;
    }
  }

  /**
   * Compte le nombre total d'ITE dans la base
   */
  async count(): Promise<number> {
    const result = await this.databaseService.db.execute<{ count: string }>(sql`
      SELECT COUNT(*) as count FROM raw_ite_fret
    `);
    return parseInt(result[0].count, 10);
  }
}
