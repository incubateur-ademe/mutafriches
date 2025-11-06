import { Injectable, Logger } from "@nestjs/common";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { Parcelle } from "../../../evaluation/entities/parcelle.entity";
import { EnrichmentResult } from "../shared/enrichissement.types";

/**
 * Service d'enrichissement du sous-domaine Urbanisme
 *
 * Responsabilités :
 * - Récupérer la proximité des commerces/services via Overpass
 * - Récupérer le taux de logements vacants via Lovac
 * - Déterminer si le site est en centre-ville
 * - Calculer la distance à l'autoroute
 *
 * TODO: Implémenter les vrais services (remplacer les données temporaires)
 * - OverpassService pour commerces/services
 * - LovacService pour logements vacants
 * - Service pour détection centre-ville
 * - Service pour distance autoroute
 */
@Injectable()
export class UrbanismeEnrichissementService {
  private readonly logger = new Logger(UrbanismeEnrichissementService.name);

  /**
   * Enrichit une parcelle avec les données d'urbanisme
   *
   * @param parcelle - Parcelle à enrichir
   * @returns Résultat de l'enrichissement
   */
  async enrichir(parcelle: Parcelle): Promise<EnrichmentResult> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];
    const champsManquants: string[] = [];

    // 1. Proximité commerces/services (Overpass)
    await this.enrichProximiteCommercesServices(
      parcelle,
      sourcesUtilisees,
      sourcesEchouees,
      champsManquants,
    );

    // 2. Taux de logements vacants (Lovac)
    await this.enrichTauxLogementsVacants(
      parcelle,
      sourcesUtilisees,
      sourcesEchouees,
      champsManquants,
    );

    // 3. Centre-ville et distance autoroute (données temporaires)
    await this.enrichDonneesTemporaires(parcelle, sourcesUtilisees);

    return {
      success: sourcesUtilisees.length > 0,
      sourcesUtilisees,
      sourcesEchouees,
      champsManquants,
    };
  }

  /**
   * Enrichit la proximité des commerces et services
   * TODO: Implémenter le vrai service Overpass
   */
  private async enrichProximiteCommercesServices(
    parcelle: Parcelle,
    sourcesUtilisees: string[],
    sourcesEchouees: string[],
    champsManquants: string[],
  ): Promise<void> {
    if (!parcelle.coordonnees) {
      this.logger.warn(
        `Pas de coordonnees pour Overpass - parcelle ${parcelle.identifiantParcelle}`,
      );
      sourcesEchouees.push(SourceEnrichissement.OVERPASS);
      champsManquants.push("proximiteCommercesServices");
      return;
    }

    try {
      // TODO: Remplacer par le vrai service Overpass
      // const result = await this.overpassService.hasCommercesServices(
      //   parcelle.coordonnees.latitude,
      //   parcelle.coordonnees.longitude,
      //   rayon: 500
      // );

      // Données temporaires - présence aléatoire de commerces/services
      const hasCommercesServices = Math.random() > 0.5;
      parcelle.proximiteCommercesServices = hasCommercesServices;
      sourcesUtilisees.push(SourceEnrichissement.OVERPASS_TEMPORAIRE);

      this.logger.debug(
        `Commerces/services (TEMPORAIRE): ${hasCommercesServices} pour ${parcelle.identifiantParcelle}`,
      );
    } catch (error) {
      this.logger.error("Erreur lors de la recuperation Overpass:", error);
      sourcesEchouees.push(SourceEnrichissement.OVERPASS);
      champsManquants.push("proximiteCommercesServices");
    }
  }

  /**
   * Enrichit le taux de logements vacants
   * TODO: Implémenter le vrai service Lovac
   */
  private async enrichTauxLogementsVacants(
    parcelle: Parcelle,
    sourcesUtilisees: string[],
    sourcesEchouees: string[],
    champsManquants: string[],
  ): Promise<void> {
    if (!parcelle.commune) {
      this.logger.warn(`Pas de commune pour Lovac - parcelle ${parcelle.identifiantParcelle}`);
      sourcesEchouees.push(SourceEnrichissement.LOVAC);
      champsManquants.push("tauxLogementsVacants");
      return;
    }

    try {
      // TODO: Remplacer par le vrai service Lovac
      // const result = await this.lovacService.getTauxLogementsVacants(
      //   parcelle.commune
      // );

      // Données temporaires - taux de logements vacants aléatoire entre 2% et 15%
      const tauxTemporaire = Math.floor(Math.random() * 13) + 2;
      parcelle.tauxLogementsVacants = tauxTemporaire;
      sourcesUtilisees.push(SourceEnrichissement.LOVAC_TEMPORAIRE);

      this.logger.debug(
        `Taux logements vacants (TEMPORAIRE): ${tauxTemporaire}% pour ${parcelle.commune}`,
      );
    } catch (error) {
      this.logger.error("Erreur lors de la recuperation Lovac:", error);
      sourcesEchouees.push(SourceEnrichissement.LOVAC);
      champsManquants.push("tauxLogementsVacants");
    }
  }

  /**
   * Enrichit les données temporaires (centre-ville, distance autoroute)
   * TODO: Implémenter les vrais services
   */
  private async enrichDonneesTemporaires(
    parcelle: Parcelle,
    sourcesUtilisees: string[],
  ): Promise<void> {
    try {
      // Données temporaires pour centre-ville
      if (parcelle.siteEnCentreVille === undefined) {
        parcelle.siteEnCentreVille = Math.random() > 0.6; // 40% de chance d'être en centre-ville
      }

      // Données temporaires pour distance autoroute
      if (parcelle.distanceAutoroute === undefined) {
        parcelle.distanceAutoroute = Math.floor(Math.random() * 20) + 1; // Entre 1 et 20 km
      }

      sourcesUtilisees.push(SourceEnrichissement.DONNEES_TEMPORAIRES);

      this.logger.debug(
        `Donnees temporaires: centre-ville=${parcelle.siteEnCentreVille}, ` +
          `autoroute=${parcelle.distanceAutoroute}km pour ${parcelle.identifiantParcelle}`,
      );
    } catch (error) {
      this.logger.error("Erreur lors de l'ajout des donnees temporaires:", error);
    }
  }
}
