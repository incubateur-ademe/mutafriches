import { Injectable, Logger } from "@nestjs/common";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { Site } from "../../../evaluation/entities/site.entity";
import { ZaeRepository } from "../../repositories/zae.repository";
import { EnrichmentResult } from "../shared/enrichissement.types";

/**
 * Enrichissement de l'appartenance du site à une zone d'activité économique (Cerema, Fusac).
 *
 * Critère scoré de poids 1 : une ZAE pénalise le résidentiel et valorise les locaux d'activité
 * et l'industrie (ADR-0049).
 */
@Injectable()
export class ZaeEnrichissementService {
  private readonly logger = new Logger(ZaeEnrichissementService.name);

  constructor(private readonly zaeRepository: ZaeRepository) {}

  async enrichir(site: Site): Promise<EnrichmentResult> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];
    const champsManquants: string[] = [];

    if (!site.coordonnees) {
      this.logger.warn(`Pas de coordonnées pour la ZAE - site ${site.identifiantParcelle}`);
      sourcesEchouees.push(SourceEnrichissement.ZAE_FUSAC);
      champsManquants.push("siteEnZae");
      return { success: false, sourcesUtilisees, sourcesEchouees, champsManquants };
    }

    // Fusac outre-mer non importé : un « Non » serait affirmé sans fondement
    if (site.codeInsee?.startsWith("97")) {
      this.logger.log(`ZAE indisponible outre-mer (${site.identifiantParcelle})`);
      sourcesEchouees.push(SourceEnrichissement.ZAE_FUSAC);
      champsManquants.push("siteEnZae");
      return { success: false, sourcesUtilisees, sourcesEchouees, champsManquants };
    }

    const dansZae = await this.zaeRepository.estDansZae(
      site.coordonnees.latitude,
      site.coordonnees.longitude,
    );

    // undefined = donnée indisponible : on ne peut pas affirmer que le site est hors ZAE
    if (dansZae === undefined) {
      sourcesEchouees.push(SourceEnrichissement.ZAE_FUSAC);
      champsManquants.push("siteEnZae");
      return { success: false, sourcesUtilisees, sourcesEchouees, champsManquants };
    }

    // Source utilisée même hors ZAE : la recherche a fonctionné
    sourcesUtilisees.push(SourceEnrichissement.ZAE_FUSAC);
    site.siteEnZae = dansZae;

    this.logger.log(
      `ZAE: site ${dansZae ? "dans" : "hors"} zone d'activité économique (${site.identifiantParcelle})`,
    );

    return { success: true, sourcesUtilisees, sourcesEchouees, champsManquants };
  }
}
