import { Injectable, Logger } from "@nestjs/common";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { Parcelle } from "../../../evaluation/entities/parcelle.entity";
import { EnrichmentResult } from "../shared/enrichissement.types";
import { DatagouvLovacService } from "../../adapters/datagouv-lovac/datagouv-lovac.service";
import { LovacCalculator } from "./lovac.calculator";

/**
 * Service d'enrichissement du sous-domaine Urbanisme
 *
 * Responsabilités :
 * - Récupérer la proximité des commerces/services via Overpass
 * - Récupérer le taux de logements vacants via LOVAC (data.gouv.fr)
 * - Déterminer si le site est en centre-ville
 * - Calculer la distance à l'autoroute
 *
 * TODO: Implémenter les vrais services restants
 * - OverpassService pour commerces/services
 * - Service pour détection centre-ville
 * - Service pour distance autoroute
 */
@Injectable()
export class UrbanismeEnrichissementService {
  private readonly logger = new Logger(UrbanismeEnrichissementService.name);

  constructor(private readonly lovacService: DatagouvLovacService) {}

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

    // Taux de logements vacants (LOVAC via data.gouv.fr)
    await this.enrichTauxLogementsVacants(
      parcelle,
      sourcesUtilisees,
      sourcesEchouees,
      champsManquants,
    );

    // Proximité commerces/services (Overpass)
    await this.enrichProximiteCommercesServices(
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
   * Enrichit le taux de logements vacants via l'API LOVAC (data.gouv.fr)
   */
  private async enrichTauxLogementsVacants(
    parcelle: Parcelle,
    sourcesUtilisees: string[],
    sourcesEchouees: string[],
    champsManquants: string[],
  ): Promise<void> {
    // Vérifier qu'on a soit le code INSEE, soit le nom de la commune
    if (!parcelle.codeInsee && !parcelle.commune) {
      this.logger.warn(
        `Pas de code INSEE ni de commune pour LOVAC - parcelle ${parcelle.identifiantParcelle}`,
      );
      sourcesEchouees.push(SourceEnrichissement.LOVAC);
      champsManquants.push("tauxLogementsVacants");
      return;
    }

    try {
      // Appel à l'API LOVAC via data.gouv.fr
      const lovacData = await this.lovacService.getLovacByCommune({
        codeInsee: parcelle.codeInsee,
        nomCommune: !parcelle.codeInsee ? parcelle.commune : undefined,
      });

      if (!lovacData) {
        this.logger.warn(
          `Aucune donnee LOVAC trouvee pour ${parcelle.codeInsee || parcelle.commune}`,
        );
        sourcesEchouees.push(SourceEnrichissement.LOVAC);
        champsManquants.push("tauxLogementsVacants");
        return;
      }

      // Vérifier si les données sont exploitables avec le calculator
      if (
        !LovacCalculator.sontDonneesExploitables(
          lovacData.nombreLogementsVacants,
          lovacData.nombreLogementsTotal,
        )
      ) {
        this.logger.warn(`Donnees LOVAC secretisees ou manquantes pour ${lovacData.commune}`);
        sourcesEchouees.push(SourceEnrichissement.LOVAC);
        champsManquants.push("tauxLogementsVacants");
        return;
      }

      // Calculer le taux avec le calculator
      const tauxVacance = LovacCalculator.calculerTauxVacance(
        lovacData.nombreLogementsVacants,
        lovacData.nombreLogementsTotal,
      );

      if (tauxVacance !== null) {
        parcelle.tauxLogementsVacants = tauxVacance;
        sourcesUtilisees.push(SourceEnrichissement.LOVAC);

        const categorie = LovacCalculator.categoriserTauxVacance(tauxVacance);

        this.logger.debug(
          `Taux logements vacants (LOVAC): ${tauxVacance}% (${categorie}) ` +
            `pour ${lovacData.commune} (millesime ${lovacData.millesime})`,
        );
      } else {
        // Cas où le calcul a échoué (normalement géré par sontDonneesExploitables)
        sourcesEchouees.push(SourceEnrichissement.LOVAC);
        champsManquants.push("tauxLogementsVacants");
      }
    } catch (error) {
      this.logger.error(
        `Erreur lors de la recuperation LOVAC pour ${parcelle.codeInsee || parcelle.commune}:`,
        error,
      );
      sourcesEchouees.push(SourceEnrichissement.LOVAC);
      champsManquants.push("tauxLogementsVacants");
    }
  }
}
