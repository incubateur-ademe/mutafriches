import { Injectable, Logger } from "@nestjs/common";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { Parcelle } from "../../../evaluation/entities/parcelle.entity";
import { EnrichmentResult } from "../shared/enrichissement.types";

/**
 * Service d'enrichissement du sous-domaine Transport
 *
 * Responsabilités :
 * - Récupérer la distance au transport en commun le plus proche
 * - Enrichir la parcelle avec les données de mobilité
 *
 * TODO: Implémenter le vrai service de transport (remplacer les données temporaires)
 */
@Injectable()
export class TransportEnrichissementService {
  private readonly logger = new Logger(TransportEnrichissementService.name);

  /**
   * Enrichit une parcelle avec les données de transport
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
        `Pas de coordonnees disponibles pour la parcelle ${parcelle.identifiantParcelle}`,
      );
      sourcesEchouees.push(SourceEnrichissement.TRANSPORT);
      champsManquants.push("distanceTransportCommun");
      return {
        success: false,
        sourcesUtilisees,
        sourcesEchouees,
        champsManquants,
      };
    }

    // TODO: Remplacer par le vrai service de transport
    // const distance = await this.transportService.getDistanceTransport(
    //   parcelle.coordonnees.latitude,
    //   parcelle.coordonnees.longitude
    // );

    try {
      // Données temporaires - distance aléatoire entre 100m et 2km
      const distanceTemporaire = Math.floor(Math.random() * 1900) + 100;

      parcelle.distanceTransportCommun = distanceTemporaire;
      sourcesUtilisees.push(SourceEnrichissement.TRANSPORT);

      this.logger.debug(
        `Distance transport (TEMPORAIRE): ${distanceTemporaire}m pour ${parcelle.identifiantParcelle}`,
      );
    } catch (error) {
      this.logger.error("Erreur lors de la recuperation transport:", error);
      sourcesEchouees.push(SourceEnrichissement.TRANSPORT);
      champsManquants.push("distanceTransportCommun");
    }

    return {
      success: sourcesUtilisees.length > 0,
      sourcesUtilisees,
      sourcesEchouees,
      champsManquants,
    };
  }
}
