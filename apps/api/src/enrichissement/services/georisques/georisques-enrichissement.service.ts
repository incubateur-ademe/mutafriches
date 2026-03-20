import { Injectable, Logger } from "@nestjs/common";
import { GeoRisquesResult } from "../../adapters/georisques/georisques.types";
import { Site } from "../../../evaluation/entities/site.entity";
import { EnrichmentResult } from "../shared/enrichissement.types";
import { GeoRisquesOrchestrator } from "./georisques.orchestrator";

/**
 * Service d'enrichissement du sous-domaine GeoRisques
 *
 * Responsabilités :
 * - Récupérer toutes les données brutes GeoRisques via l'orchestrateur
 * - Fournir un objet structuré pour les intégrateurs et analyses
 *
 * Note : ce service retourne les données brutes GeoRisques en plus de l'EnrichmentResult
 * car elles sont utilisées directement dans le DTO de sortie (pas stockées sur le Site)
 */
@Injectable()
export class GeoRisquesEnrichissementService {
  private readonly logger = new Logger(GeoRisquesEnrichissementService.name);

  constructor(private readonly orchestrator: GeoRisquesOrchestrator) {}

  /**
   * Enrichit avec toutes les données brutes GeoRisques
   *
   * @param site - Site à enrichir (doit avoir des coordonnées)
   * @returns Résultat de l'enrichissement et données GeoRisques structurées
   */
  async enrichir(site: Site): Promise<{
    result: EnrichmentResult;
    data: GeoRisquesResult | undefined;
  }> {
    if (!site.coordonnees) {
      this.logger.warn(
        `Pas de coordonnées disponibles pour GeoRisques - site ${site.identifiantParcelle}`,
      );
      return {
        result: { success: false, sourcesUtilisees: [], sourcesEchouees: [] },
        data: undefined,
      };
    }

    this.logger.log(
      `Démarrage enrichissement GeoRisques pour (${site.coordonnees.latitude}, ${site.coordonnees.longitude})`,
    );

    // Déléguer à l'orchestrateur
    const orchestrationResult = await this.orchestrator.fetchAll(site.coordonnees);

    return {
      result: {
        success: orchestrationResult.sourcesUtilisees.length > 0,
        sourcesUtilisees: orchestrationResult.sourcesUtilisees,
        sourcesEchouees: orchestrationResult.sourcesEchouees,
      },
      data: orchestrationResult.data,
    };
  }
}
