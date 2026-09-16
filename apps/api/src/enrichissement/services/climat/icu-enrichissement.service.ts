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
    const echec = (): EnrichmentResult => {
      sourcesEchouees.push(SourceEnrichissement.ICU);
      champsManquants.push("ilotChaleurUrbain");
      return { success: false, sourcesUtilisees, sourcesEchouees, champsManquants };
    };

    if (!site.coordonnees) {
      this.logger.warn(`Pas de coordonnées pour ICU - site ${site.identifiantParcelle}`);
      return echec();
    }

    const zone = await this.icuRepository.findZoneProche(
      site.coordonnees.latitude,
      site.coordonnees.longitude,
    );

    // undefined = lecture en échec : on ne peut rien affirmer sur l'exposition du site
    if (zone === undefined) {
      return echec();
    }

    if (zone === null) {
      const couverture = await this.determinerCouverture(site);
      if (couverture === undefined) {
        return echec();
      }

      sourcesUtilisees.push(SourceEnrichissement.ICU);
      site.ilotChaleurUrbain = couverture;
      site.intensiteIlotChaleurC = null;
      return { success: true, sourcesUtilisees, sourcesEchouees, champsManquants };
    }

    sourcesUtilisees.push(SourceEnrichissement.ICU);
    site.ilotChaleurUrbain =
      zone.iuhi >= SEUIL_ILOT_CHALEUR_C ? IlotChaleurUrbain.OUI : IlotChaleurUrbain.NON;
    site.intensiteIlotChaleurC = zone.iuhi;

    this.logger.log(
      `ICU: ${site.ilotChaleurUrbain} (${zone.iuhi} °C, zone ${zone.codeGiris} ` +
        `à ${Math.round(zone.distanceM)} m) pour ${site.identifiantParcelle}`,
    );

    return { success: true, sourcesUtilisees, sourcesEchouees, champsManquants };
  }

  /**
   * Aucune zone à proximité : reste à savoir si la commune a été étudiée. Les zones CSTB ne
   * couvrent que l'enveloppe urbaine dense (environ 57 % du territoire communal à Angers),
   * si bien qu'une commune du périmètre laisse de larges secteurs sans zone. Les confondre
   * annonçait « non couvert par la cartographie » à des sites pourtant étudiés (ADR-0037).
   */
  private async determinerCouverture(site: Site): Promise<IlotChaleurUrbain | undefined> {
    if (!site.codeInsee) {
      this.logger.warn(`Pas de code INSEE pour ICU - site ${site.identifiantParcelle}`);
      return IlotChaleurUrbain.NON_COUVERT;
    }

    const communeCouverte = await this.icuRepository.communeEstCouverte(site.codeInsee);
    if (communeCouverte === undefined) {
      return undefined;
    }

    this.logger.log(
      `ICU: aucune zone à proximité, commune ${site.codeInsee} ` +
        `${communeCouverte ? "étudiée" : "hors périmètre"} (${site.identifiantParcelle})`,
    );

    return communeCouverte ? IlotChaleurUrbain.NON : IlotChaleurUrbain.NON_COUVERT;
  }
}
