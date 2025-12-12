import { Injectable, Logger } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DatabaseService } from "../../shared/database/database.service";

/**
 * Repository pour interroger les points d'arrêt de transport
 */
@Injectable()
export class TransportStopsRepository {
  private readonly logger = new Logger(TransportStopsRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Trouve le point d'arrêt de transport le plus proche d'une coordonnée
   *
   * @param latitude Latitude WGS84
   * @param longitude Longitude WGS84
   * @param rayonMetres Rayon de recherche en mètres
   * @returns Distance en mètres au point d'arrêt le plus proche, ou null si aucun trouvé
   */
  async findTransportStopProximite(
    latitude: number,
    longitude: number,
    rayonMetres: number,
  ): Promise<number | null> {
    try {
      const result = await this.databaseService.db.execute<{ distance: number }>(sql`
        SELECT 
          ST_Distance(
            ST_SetSRID(ST_MakePoint(stop_lon, stop_lat), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
          ) as distance
        FROM raw_transport_stops
        WHERE ST_DWithin(
          ST_SetSRID(ST_MakePoint(stop_lon, stop_lat), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${rayonMetres}
        )
        ORDER BY 
          ST_SetSRID(ST_MakePoint(stop_lon, stop_lat), 4326)::geography <->
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        LIMIT 1
      `);

      if (result.length === 0) {
        this.logger.debug(
          `Aucun point d'arrêt trouvé dans un rayon de ${rayonMetres}m pour lat=${latitude}, lon=${longitude}`,
        );
        return null;
      }

      const distance = result[0].distance;

      this.logger.debug(
        `Point d'arrêt trouvé à ${Math.round(distance)}m pour lat=${latitude}, lon=${longitude}`,
      );

      return distance;
    } catch (error) {
      this.logger.error("Erreur lors de la recherche de transport stop:", error);
      throw error;
    }
  }

  /**
   * Compte le nombre total de points d'arrêt dans la base
   */
  async count(): Promise<number> {
    const result = await this.databaseService.db.execute<{ count: string }>(sql`
      SELECT COUNT(*) as count FROM raw_transport_stops
    `);
    return parseInt(result[0].count, 10);
  }

  /**
   * Obtient des statistiques sur les types de points d'arrêt
   */
  async getStatistics(): Promise<
    Array<{
      locationType: string;
      count: number;
    }>
  > {
    const result = await this.databaseService.db.execute<{
      location_type: string;
      count: string;
    }>(sql`
      SELECT 
        COALESCE(location_type, '0') as location_type,
        COUNT(*) as count
      FROM raw_transport_stops
      GROUP BY location_type
      ORDER BY COUNT(*) DESC
    `);

    return result.map((row) => ({
      locationType: row.location_type,
      count: parseInt(row.count, 10),
    }));
  }
}
