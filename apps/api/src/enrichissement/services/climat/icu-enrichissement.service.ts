import { Injectable, Logger } from "@nestjs/common";
import { IlotChaleurUrbain, SourceEnrichissement } from "@mutafriches/shared-types";
import { Site } from "../../../evaluation/entities/site.entity";
import { IcuRepository } from "../../repositories/icu.repository";
import { EnrichmentResult } from "../shared/enrichissement.types";

/**
 * Seuil métier au-delà duquel le site est déclaré concerné par un îlot de chaleur, en °C.
 * Choix produit : la doc CSTB ne définit aucun palier sur l'indicateur iuhi.
 */
export const SEUIL_ILOT_CHALEUR_C = 5.5;

/**
 * Enrichissement de l'exposition du site à un îlot de chaleur urbain (ICU).
 *
 * Donnée strictement informative : restituée à l'utilisateur, jamais injectée dans le
 * calcul de mutabilité ni dans la fiabilité (ADR-0034).
 */
@Injectable()
export class IcuEnrichissementService {
  private readonly logger = new Logger(IcuEnrichissementService.name);

  constructor(private readonly icuRepository: IcuRepository) {}

  async enrichir(site: Site): Promise<EnrichmentResult> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];
    const champsManquants: string[] = [];

    if (!site.coordonnees) {
      this.logger.warn(`Pas de coordonnées pour ICU - site ${site.identifiantParcelle}`);
      sourcesEchouees.push(SourceEnrichissement.ICU);
      champsManquants.push("ilotChaleurUrbain");
      return { success: false, sourcesUtilisees, sourcesEchouees, champsManquants };
    }

    const zone = await this.icuRepository.findZoneContenant(
      site.coordonnees.latitude,
      site.coordonnees.longitude,
    );

    // undefined = lecture en échec : on ne peut rien affirmer sur l'exposition du site
    if (zone === undefined) {
      sourcesEchouees.push(SourceEnrichissement.ICU);
      champsManquants.push("ilotChaleurUrbain");
      return { success: false, sourcesUtilisees, sourcesEchouees, champsManquants };
    }

    // Source utilisée même hors périmètre : la recherche a fonctionné
    sourcesUtilisees.push(SourceEnrichissement.ICU);

    if (zone === null) {
      site.ilotChaleurUrbain = IlotChaleurUrbain.NON_COUVERT;
      site.intensiteIlotChaleurC = null;
      this.logger.log(`ICU: site hors périmètre d'étude (${site.identifiantParcelle})`);
      return { success: true, sourcesUtilisees, sourcesEchouees, champsManquants };
    }

    site.ilotChaleurUrbain =
      zone.iuhi >= SEUIL_ILOT_CHALEUR_C ? IlotChaleurUrbain.OUI : IlotChaleurUrbain.NON;
    site.intensiteIlotChaleurC = zone.iuhi;

    this.logger.log(
      `ICU: ${site.ilotChaleurUrbain} (${zone.iuhi} °C, zone ${zone.codeGiris}) ` +
        `pour ${site.identifiantParcelle}`,
    );

    return { success: true, sourcesUtilisees, sourcesEchouees, champsManquants };
  }
}
