import { Injectable, Logger } from "@nestjs/common";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { Site } from "../../../evaluation/entities/site.entity";
import { ZonesContrainteEnrRepository } from "../../repositories/zones-contrainte-enr.repository";
import { EnrichmentResult } from "../shared/enrichissement.types";

/**
 * Saturation du réseau électrique pour raccorder un projet EnR (carte Enedis/RTE, ADR-0046).
 * Seul le statut SATUREE compte comme saturé : EN_TENSION reste raccordable.
 */
@Injectable()
export class SaturationReseauEnrEnrichissementService {
  private readonly logger = new Logger(SaturationReseauEnrEnrichissementService.name);

  constructor(private readonly zonesContrainteEnrRepository: ZonesContrainteEnrRepository) {}

  async enrichir(site: Site): Promise<EnrichmentResult> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];
    const champsManquants: string[] = [];

    if (!site.coordonnees) {
      this.logger.warn(
        `Pas de coordonnées pour la saturation EnR - site ${site.identifiantParcelle}`,
      );
      sourcesEchouees.push(SourceEnrichissement.ZONES_CONTRAINTE_ENR);
      champsManquants.push("saturationReseauEnr");
      return { success: false, sourcesUtilisees, sourcesEchouees, champsManquants };
    }

    const statut = await this.zonesContrainteEnrRepository.findStatutZoneContenant(
      site.coordonnees.latitude,
      site.coordonnees.longitude,
    );

    // Hors zone ou zone d'une régie locale (ELD) : Enedis ne se prononce pas, un « Non »
    // serait affirmé sans fondement.
    if (statut === undefined || statut === null || statut === "ELD") {
      this.logger.log(
        `Saturation EnR indisponible (${statut ?? "aucune zone"}) pour ${site.identifiantParcelle}`,
      );
      sourcesEchouees.push(SourceEnrichissement.ZONES_CONTRAINTE_ENR);
      champsManquants.push("saturationReseauEnr");
      return { success: false, sourcesUtilisees, sourcesEchouees, champsManquants };
    }

    sourcesUtilisees.push(SourceEnrichissement.ZONES_CONTRAINTE_ENR);
    site.saturationReseauEnr = statut === "SATUREE";
    this.logger.log(`Saturation EnR : zone ${statut} pour ${site.identifiantParcelle}`);

    return { success: true, sourcesUtilisees, sourcesEchouees, champsManquants };
  }
}
