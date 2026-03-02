import { Injectable, Logger } from "@nestjs/common";
import {
  GeometrieParcelle,
  SourceEnrichissement,
  ZaerEnrichissement,
} from "@mutafriches/shared-types";
import { ZaerWfsService } from "../../adapters/zaer-wfs/zaer-wfs.service";
import { ZaerWfsResult } from "../../adapters/zaer-wfs/zaer-wfs.types";
import { EnrichmentResult } from "../shared/enrichissement.types";

/**
 * Service d'enrichissement ENR (Énergies Renouvelables)
 *
 * Détermine si un site est situé dans une ou plusieurs Zones d'Accélération
 * des Énergies Renouvelables (ZAER) et identifie les filières concernées.
 *
 * Interroge le WFS Géoplateforme à la volée (pas de stockage en base).
 *
 * Stratégie :
 * 1. Si la géométrie du site est disponible, utilise INTERSECTS (polygone vs polygone)
 * 2. Sinon, fallback par coordonnées du centroïde (point vs polygone)
 */
@Injectable()
export class EnrEnrichissementService {
  private readonly logger = new Logger(EnrEnrichissementService.name);

  constructor(private readonly zaerWfsService: ZaerWfsService) {}

  /**
   * Enrichit un site avec les données ZAER
   *
   * @param geometrie Géométrie GeoJSON du site (optionnel)
   * @param coordonnees Coordonnées du centroïde (fallback)
   * @returns Résultat d'enrichissement avec les données ZAER
   */
  async enrichir(
    geometrie?: GeometrieParcelle,
    coordonnees?: { latitude: number; longitude: number },
  ): Promise<{ result: EnrichmentResult; data?: ZaerEnrichissement }> {
    try {
      let zones: ZaerWfsResult[];

      if (geometrie) {
        zones = await this.zaerWfsService.findZaerIntersectingSite(geometrie);
      } else if (coordonnees) {
        zones = await this.zaerWfsService.findZaerAtPoint(
          coordonnees.latitude,
          coordonnees.longitude,
        );
      } else {
        this.logger.warn("Enrichissement ENR impossible : ni géométrie ni coordonnées");
        return {
          result: {
            success: false,
            sourcesUtilisees: [],
            sourcesEchouees: [SourceEnrichissement.ZAER],
            champsManquants: ["zaer"],
          },
        };
      }

      const enZoneZaer = zones.length > 0;
      const filieres = [...new Set(zones.map((z) => z.filiere))];

      const zaer: ZaerEnrichissement = {
        enZoneZaer,
        nombreZones: zones.length,
        filieres,
        zones: zones.map((z) => ({
          nom: z.nom,
          filiere: z.filiere,
          detailFiliere: z.detailFiliere,
        })),
      };

      this.logger.debug(
        `ENR: enZoneZaer=${enZoneZaer}, ${zones.length} zone(s), filières=[${filieres.join(", ")}]`,
      );

      return {
        result: {
          success: true,
          sourcesUtilisees: [SourceEnrichissement.ZAER],
          sourcesEchouees: [],
        },
        data: zaer,
      };
    } catch (error) {
      this.logger.error("Erreur lors de l'enrichissement ENR:", error);
      return {
        result: {
          success: false,
          sourcesUtilisees: [],
          sourcesEchouees: [SourceEnrichissement.ZAER],
          champsManquants: ["zaer"],
        },
      };
    }
  }
}
