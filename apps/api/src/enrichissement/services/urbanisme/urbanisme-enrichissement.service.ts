import { Injectable, Logger } from "@nestjs/common";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { Parcelle } from "../../../evaluation/entities/parcelle.entity";
import { EnrichmentResult } from "../shared/enrichissement.types";
import { DatagouvLovacService } from "../../adapters/datagouv-lovac/datagouv-lovac.service";
import { LovacCalculator } from "./lovac.calculator";

/**
 * Rayon de recherche pour les commerces/services (en metres)
 *
 * Defini a 500m car :
 * - C'est la distance de marche standard (5-7 min)
 * - Correspond au critere Excel "Commerces / services a proximite"
 */
const RAYON_RECHERCHE_COMMERCES_M = 500;

/**
 * Service d'enrichissement du sous-domaine Urbanisme
 *
 * Responsabilites :
 * - Recuperer la proximite des commerces/services via Overpass (OSM)
 * - Recuperer le taux de logements vacants via LOVAC (data.gouv.fr)
 */
@Injectable()
export class UrbanismeEnrichissementService {
  private readonly logger = new Logger(UrbanismeEnrichissementService.name);

  constructor(private readonly lovacService: DatagouvLovacService) {}

  /**
   * Enrichit une parcelle avec les donnees d'urbanisme
   *
   * @param parcelle - Parcelle a enrichir
   * @returns Resultat de l'enrichissement
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

    // Proximite commerces/services (Overpass)
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
   * Enrichit la proximite des commerces et services via Overpass (OSM)
   *
   * Types de commerces/services recherches :
   * - Alimentation : supermarche, epicerie, boulangerie, boucherie
   * - Sante : pharmacie, medecin
   * - Services publics : poste, banque
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
      const overpassResult = await this.overpassService.hasCommercesServices(
        parcelle.coordonnees.latitude,
        parcelle.coordonnees.longitude,
        RAYON_RECHERCHE_COMMERCES_M,
      );

      if (!overpassResult.success || !overpassResult.data) {
        throw new Error(overpassResult.error || "Erreur Overpass");
      }

      const result = overpassResult.data;
      parcelle.proximiteCommercesServices = result.presenceCommercesServices;
      sourcesUtilisees.push(SourceEnrichissement.OVERPASS);

      if (result.presenceCommercesServices) {
        this.logger.log(
          `Commerces/services: OUI (${result.nombreCommercesServices} trouves, ` +
            `plus proche a ${result.distancePlusProche}m) ` +
            `pour ${parcelle.identifiantParcelle}`,
        );

        if (result.categoriesTrouvees && result.categoriesTrouvees.length > 0) {
          this.logger.debug(`Categories trouvees: ${result.categoriesTrouvees.join(", ")}`);
        }
      } else {
        this.logger.log(
          `Commerces/services: NON (aucun dans un rayon de ${RAYON_RECHERCHE_COMMERCES_M}m) ` +
            `pour ${parcelle.identifiantParcelle}`,
        );
      }
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
    // Verifier qu'on a soit le code INSEE, soit le nom de la commune
    if (!parcelle.codeInsee && !parcelle.commune) {
      this.logger.warn(
        `Pas de code INSEE ni de commune pour LOVAC - parcelle ${parcelle.identifiantParcelle}`,
      );
      sourcesEchouees.push(SourceEnrichissement.LOVAC);
      champsManquants.push("tauxLogementsVacants");
      return;
    }

    try {
      // Appel a l'API LOVAC via data.gouv.fr
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

      // Verifier si les donnees sont exploitables avec le calculator
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
        // Cas ou le calcul a echoue (normalement gere par sontDonneesExploitables)
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
