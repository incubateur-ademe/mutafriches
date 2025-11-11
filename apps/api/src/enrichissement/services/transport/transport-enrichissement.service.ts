import { Injectable, Logger } from "@nestjs/common";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { Parcelle } from "../../../evaluation/entities/parcelle.entity";
import { EnrichmentResult } from "../shared/enrichissement.types";
import { ServicePublicService } from "../../adapters/service-public/service-public.service";
import { calculateDistance } from "../../adapters/shared/distance.utils";
import { TransportCalculator } from "./transport-enrichissement.calculator";

/**
 * Service d'enrichissement du sous-domaine Transport
 *
 * Responsabilités :
 * - Déterminer si la parcelle est en centre-ville (distance à la mairie)
 * - Récupérer la distance au transport en commun le plus proche (TODO)
 */
@Injectable()
export class TransportEnrichissementService {
  private readonly logger = new Logger(TransportEnrichissementService.name);

  constructor(private readonly servicePublicService: ServicePublicService) {}

  async enrichir(parcelle: Parcelle): Promise<EnrichmentResult> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];
    const champsManquants: string[] = [];

    // Vérifications préliminaires
    if (!parcelle.coordonnees) {
      this.logger.warn(
        `Pas de coordonnees disponibles pour la parcelle ${parcelle.identifiantParcelle}`,
      );
      sourcesEchouees.push(SourceEnrichissement.SERVICE_PUBLIC);
      champsManquants.push("siteEnCentreVille");
      return { success: false, sourcesUtilisees, sourcesEchouees, champsManquants };
    }

    if (!parcelle.codeInsee) {
      this.logger.warn(`Code INSEE manquant pour la parcelle ${parcelle.identifiantParcelle}`);
      sourcesEchouees.push(SourceEnrichissement.SERVICE_PUBLIC);
      champsManquants.push("siteEnCentreVille");
      return { success: false, sourcesUtilisees, sourcesEchouees, champsManquants };
    }

    // Enrichissements
    await this.enrichirCentreVille(parcelle, sourcesUtilisees, sourcesEchouees, champsManquants);
    await this.enrichirTransportCommun(
      parcelle,
      sourcesUtilisees,
      sourcesEchouees,
      champsManquants,
    );

    return {
      success: sourcesUtilisees.length > 0,
      sourcesUtilisees,
      sourcesEchouees,
      champsManquants,
    };
  }

  /**
   * Détermine si la parcelle est en centre-ville via l'API Service Public
   */
  private async enrichirCentreVille(
    parcelle: Parcelle,
    sourcesUtilisees: string[],
    sourcesEchouees: string[],
    champsManquants: string[],
  ): Promise<void> {
    try {
      if (!parcelle.coordonnees) {
        throw new Error("Coordonnées non disponibles");
      }

      this.logger.debug(
        `Parcelle ${parcelle.identifiantParcelle}: ` +
          `lat=${parcelle.coordonnees.latitude.toFixed(5)}, lon=${parcelle.coordonnees.longitude.toFixed(5)}`,
      );

      // Récupérer les coordonnées officielles de la mairie
      const mairieResult = await this.servicePublicService.getMairieCoordonnees(parcelle.codeInsee);

      if (!mairieResult.success || !mairieResult.data) {
        throw new Error(mairieResult.error || "Mairie non trouvée");
      }

      const coordonneesMairie = mairieResult.data.coordonnees;

      this.logger.debug(
        `Mairie ${mairieResult.data.nomCommune} (${parcelle.codeInsee}): ` +
          `lat=${coordonneesMairie.latitude.toFixed(5)}, lon=${coordonneesMairie.longitude.toFixed(5)}`,
      );

      // Calculer la distance
      const distanceMetres = calculateDistance(
        parcelle.coordonnees.latitude,
        parcelle.coordonnees.longitude,
        coordonneesMairie.latitude,
        coordonneesMairie.longitude,
      );

      this.logger.debug(`Distance calculée: ${Math.round(distanceMetres)}m`);

      // Déterminer si en centre-ville
      parcelle.siteEnCentreVille = TransportCalculator.isCentreVille(distanceMetres);
      sourcesUtilisees.push(SourceEnrichissement.SERVICE_PUBLIC);

      this.logger.log(
        `Centre-ville: ${parcelle.siteEnCentreVille ? "OUI" : "NON"} ` +
          `(distance mairie: ${Math.round(distanceMetres)}m) ` +
          `pour ${parcelle.identifiantParcelle}`,
      );
    } catch (error) {
      this.logger.error("Erreur lors de la determination centre-ville:", error);
      sourcesEchouees.push(SourceEnrichissement.SERVICE_PUBLIC);
      champsManquants.push("siteEnCentreVille");
      // Valeur par défaut conservative : pas en centre-ville
      parcelle.siteEnCentreVille = false;
    }
  }

  /**
   * Récupère la distance au transport en commun (TODO - temporaire)
   */
  private async enrichirTransportCommun(
    parcelle: Parcelle,
    sourcesUtilisees: string[],
    sourcesEchouees: string[],
    champsManquants: string[],
  ): Promise<void> {
    try {
      // TODO: Remplacer par le vrai service de transport
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
  }
}
