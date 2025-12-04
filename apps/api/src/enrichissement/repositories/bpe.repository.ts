import { Injectable, Logger } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DatabaseService } from "../../shared/database/database.service";
import { BPE_CODES_COMMERCES_SERVICES } from "../constants/bpe.constants";

export interface BpeProximiteResult {
  presenceCommercesServices: boolean;
  nombreCommercesServices: number;
  distancePlusProche: number | null;
  categoriesTrouvees: string[];
}

/**
 * Repository pour les donnees BPE (Base Permanente des Equipements)
 *
 * Utilise PostGIS pour les requetes spatiales sur la table raw_bpe
 */
@Injectable()
export class BpeRepository {
  private readonly logger = new Logger(BpeRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Recherche les commerces/services dans un rayon autour d'un point
   *
   * @param latitude - Latitude du point central
   * @param longitude - Longitude du point central
   * @param rayonMetres - Rayon de recherche en metres
   * @returns Resultat avec presence, nombre et distance du plus proche
   */
  async findCommercesServicesProximite(
    latitude: number,
    longitude: number,
    rayonMetres: number,
  ): Promise<BpeProximiteResult> {
    try {
      const codesCommerces = BPE_CODES_COMMERCES_SERVICES;

      // Requete PostGIS avec ST_DWithin pour la performance (utilise l'index spatial)
      const result = await this.databaseService.db.execute<{
        code_equipement: string;
        distance_m: number;
      }>(sql`
        SELECT 
          code_equipement,
          ST_Distance(
            geom::geography,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
          ) as distance_m
        FROM raw_bpe
        WHERE code_equipement IN ${sql.raw(`('${codesCommerces.join("','")}')`)}
          AND ST_DWithin(
            geom::geography,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
            ${rayonMetres}
          )
        ORDER BY distance_m ASC
      `);

      const rows = result as unknown as Array<{
        code_equipement: string;
        distance_m: number;
      }>;

      if (rows.length === 0) {
        return {
          presenceCommercesServices: false,
          nombreCommercesServices: 0,
          distancePlusProche: null,
          categoriesTrouvees: [],
        };
      }

      // Extraire les categories uniques
      const categoriesUniques = [...new Set(rows.map((r) => r.code_equipement))];

      return {
        presenceCommercesServices: true,
        nombreCommercesServices: rows.length,
        distancePlusProche: Math.round(rows[0].distance_m),
        categoriesTrouvees: categoriesUniques,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la recherche BPE commerces/services:", error);
      throw error;
    }
  }
}
