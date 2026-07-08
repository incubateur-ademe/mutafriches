import { Injectable, Logger } from "@nestjs/common";
import { SourceEnrichissement, ZaerEnrichissement } from "@mutafriches/shared-types";
import { Site } from "../../../evaluation/entities/site.entity";
import { ApiResponse } from "../../adapters/shared/api-response.types";
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
 *
 * Note : ce service retourne les données ZAER en plus de l'EnrichmentResult
 * car elles sont utilisées directement dans le DTO de sortie (pas stockées sur le Site)
 */
@Injectable()
export class EnrEnrichissementService {
  private readonly logger = new Logger(EnrEnrichissementService.name);

  constructor(private readonly zaerWfsService: ZaerWfsService) {}

  /**
   * Enrichit un site avec les données ZAER
   *
   * @param site - Site à enrichir (doit avoir géométrie ou coordonnées)
   * @returns Résultat d'enrichissement avec les données ZAER
   */
  async enrichir(site: Site): Promise<{ result: EnrichmentResult; data?: ZaerEnrichissement }> {
    try {
      let response: ApiResponse<ZaerWfsResult[]>;

      if (site.geometrie) {
        response = await this.zaerWfsService.findZaerIntersectingSite(site.geometrie);
      } else if (site.coordonnees) {
        response = await this.zaerWfsService.findZaerAtPoint(
          site.coordonnees.latitude,
          site.coordonnees.longitude,
        );
      } else {
        this.logger.warn(
          `Enrichissement ENR impossible : ni géométrie ni coordonnées - site ${site.identifiantParcelle}`,
        );
        return {
          result: {
            success: false,
            sourcesUtilisees: [],
            sourcesEchouees: [SourceEnrichissement.ZAER],
            champsManquants: ["zaer"],
          },
        };
      }

      if (!response.success || !response.data) {
        this.logger.error(`Erreur lors de l'enrichissement ENR : ${response.error ?? "inconnue"}`);
        return {
          result: {
            success: false,
            sourcesUtilisees: [],
            sourcesEchouees: [SourceEnrichissement.ZAER],
            champsManquants: ["zaer"],
          },
        };
      }

      const zones = response.data;
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
      this.logger.error(
        `Erreur lors de l'enrichissement ENR : ${error instanceof Error ? error.message : String(error)}`,
      );
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
