import { Injectable, Logger } from "@nestjs/common";
import { GeoRisquesResult } from "../../adapters/georisques/georisques.types";
import { EnrichmentResult } from "../shared/enrichissement.types";
import { GeoRisquesOrchestrator } from "./georisques.orchestrator";

/**
 * Service d'enrichissement du sous-domaine GeoRisques
 *
 * Responsabilités :
 * - Récupérer toutes les données brutes GeoRisques via l'orchestrateur
 * - Fournir un objet structuré pour les intégrateurs et analyses
 */
@Injectable()
export class GeoRisquesEnrichissementService {
  private readonly logger = new Logger(GeoRisquesEnrichissementService.name);

  constructor(private readonly orchestrator: GeoRisquesOrchestrator) {}

  /**
   * Enrichit avec toutes les données brutes GeoRisques
   *
   * @param coordonnees - Coordonnées géographiques (obligatoires)
   * @returns Résultat de l'enrichissement et données GeoRisques structurées
   */
  async enrichir(coordonnees: { latitude: number; longitude: number }): Promise<{
    result: EnrichmentResult;
    data: GeoRisquesResult | undefined;
  }> {
    this.logger.log(
      `Demarrage enrichissement GeoRisques pour (${coordonnees.latitude}, ${coordonnees.longitude})`,
    );

    // Déléguer à l'orchestrateur
    const orchestrationResult = await this.orchestrator.fetchAll(coordonnees);

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
