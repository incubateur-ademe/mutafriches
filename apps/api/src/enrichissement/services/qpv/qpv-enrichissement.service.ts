import { Injectable, Logger } from "@nestjs/common";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { Site } from "../../../evaluation/entities/site.entity";
import { QpvRepository } from "../../repositories/qpv.repository";
import { EnrichmentResult } from "../shared/enrichissement.types";

/**
 * Enrichissement de l'appartenance du site à un quartier prioritaire de la politique de la
 * ville (QPV).
 *
 * Critère scoré de poids 1 : un site en QPV valorise fortement le résidentiel et les
 * équipements publics, pénalise le tertiaire et le photovoltaïque (ADR-0037).
 */
@Injectable()
export class QpvEnrichissementService {
  private readonly logger = new Logger(QpvEnrichissementService.name);

  constructor(private readonly qpvRepository: QpvRepository) {}

  async enrichir(site: Site): Promise<EnrichmentResult> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];
    const champsManquants: string[] = [];

    if (!site.coordonnees) {
      this.logger.warn(`Pas de coordonnées pour QPV - site ${site.identifiantParcelle}`);
      sourcesEchouees.push(SourceEnrichissement.QPV);
      champsManquants.push("siteEnQpv");
      return { success: false, sourcesUtilisees, sourcesEchouees, champsManquants };
    }

    const quartier = await this.qpvRepository.findQuartierContenant(
      site.coordonnees.latitude,
      site.coordonnees.longitude,
    );

    // undefined = donnée indisponible : on ne peut pas affirmer que le site est hors QPV
    if (quartier === undefined) {
      sourcesEchouees.push(SourceEnrichissement.QPV);
      champsManquants.push("siteEnQpv");
      return { success: false, sourcesUtilisees, sourcesEchouees, champsManquants };
    }

    // Source utilisée même hors QPV : la recherche a fonctionné
    sourcesUtilisees.push(SourceEnrichissement.QPV);
    site.siteEnQpv = quartier !== null;

    this.logger.log(
      quartier === null
        ? `QPV: site hors quartier prioritaire (${site.identifiantParcelle})`
        : `QPV: ${quartier.nomQpv} (${quartier.codeQpv}) pour ${site.identifiantParcelle}`,
    );

    return { success: true, sourcesUtilisees, sourcesEchouees, champsManquants };
  }
}
