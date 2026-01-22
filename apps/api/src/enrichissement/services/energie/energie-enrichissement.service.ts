import { Injectable, Logger } from "@nestjs/common";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { Parcelle } from "../../../evaluation/entities/parcelle.entity";
import { EnedisService } from "../../adapters/enedis/enedis.service";
import { EnrichmentResult } from "../shared/enrichissement.types";

/**
 * Service d'enrichissement du sous-domaine Energie
 *
 * Responsabilités :
 * - Récupérer la distance de raccordement électrique via Enedis
 * - Enrichir la parcelle avec les données énergétiques
 */
@Injectable()
export class EnergieEnrichissementService {
  private readonly logger = new Logger(EnergieEnrichissementService.name);

  constructor(private readonly enedisService: EnedisService) {}

  /**
   * Enrichit une parcelle avec les données énergétiques
   *
   * @param parcelle - Parcelle à enrichir (doit avoir des coordonnées)
   * @returns Résultat de l'enrichissement
   */
  async enrichir(parcelle: Parcelle): Promise<EnrichmentResult> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];
    const champsManquants: string[] = [];

    // Vérifier la présence des coordonnées
    if (!parcelle.coordonnees) {
      this.logger.warn(
        `Pas de coordonnées disponibles pour la parcelle ${parcelle.identifiantParcelle}`,
      );
      sourcesEchouees.push(SourceEnrichissement.ENEDIS_RACCORDEMENT);
      champsManquants.push("distanceRaccordementElectrique");
      return {
        success: false,
        sourcesUtilisees,
        sourcesEchouees,
        champsManquants,
      };
    }

    // Récupérer la distance de raccordement électrique
    try {
      const distanceResult = await this.enedisService.getDistanceRaccordement(
        parcelle.coordonnees.latitude,
        parcelle.coordonnees.longitude,
      );

      if (distanceResult.success && distanceResult.data) {
        parcelle.distanceRaccordementElectrique = distanceResult.data.distance;
        sourcesUtilisees.push(SourceEnrichissement.ENEDIS_RACCORDEMENT);
        this.logger.log(
          `Distance raccordement électrique: ${Math.round(distanceResult.data.distance)}m pour ${parcelle.identifiantParcelle}`,
        );
      } else {
        this.logger.warn(`Échec récupération Enedis: ${distanceResult.error || "Aucune donnée"}`);
        sourcesEchouees.push(SourceEnrichissement.ENEDIS_RACCORDEMENT);
        champsManquants.push("distanceRaccordementElectrique");
      }
    } catch (error) {
      this.logger.error("Erreur lors de la récupération Enedis:", error);
      sourcesEchouees.push(SourceEnrichissement.ENEDIS_RACCORDEMENT);
      champsManquants.push("distanceRaccordementElectrique");
    }

    return {
      success: sourcesUtilisees.length > 0,
      sourcesUtilisees,
      sourcesEchouees,
      champsManquants,
    };
  }
}
