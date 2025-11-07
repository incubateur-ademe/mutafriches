import { Injectable, Logger } from "@nestjs/common";
import { ZonageReglementaire } from "@mutafriches/shared-types";
import { ResultatZoneUrba, ResultatSecteurCC, InfoCommune } from "./zonage-reglementaire.types";

/**
 * Calculator du sous-domaine Zonage Réglementaire
 *
 * Contient toute la logique métier pure pour évaluer le zonage réglementaire
 * basé sur PLU/POS (zone-urba) ou carte communale (secteur-cc) ou RNU
 */
@Injectable()
export class ZonageReglementaireCalculator {
  private readonly logger = new Logger(ZonageReglementaireCalculator.name);

  /**
   * Évalue le zonage réglementaire final
   *
   * Règles métier (par ordre de priorité) :
   * 1. Si zone-urba présente → analyser typezone (U, AU, A, N)
   * 2. Si secteur-cc présent → analyser typesect (constructible/non constructible)
   * 3. Si commune en RNU → NE_SAIT_PAS
   * 4. Sinon → NE_SAIT_PAS
   */
  evaluer(
    zoneUrba: ResultatZoneUrba | null,
    secteurCC: ResultatSecteurCC | null,
    commune: InfoCommune | null,
  ): ZonageReglementaire {
    // Priorité 1 : Zone PLU/POS
    if (zoneUrba?.present && zoneUrba.typezone) {
      return this.mapZoneUrbaToZonage(zoneUrba.typezone, zoneUrba.destdomi);
    }

    // Priorité 2 : Secteur carte communale
    if (secteurCC?.present && secteurCC.typesect) {
      return this.mapSecteurCCToZonage(secteurCC.typesect);
    }

    // Priorité 3 : RNU
    if (commune?.is_rnu) {
      this.logger.debug("Zonage réglementaire: NE_SAIT_PAS (RNU)");
      return ZonageReglementaire.NE_SAIT_PAS;
    }

    // Par défaut
    this.logger.debug("Zonage réglementaire: NE_SAIT_PAS");
    return ZonageReglementaire.NE_SAIT_PAS;
  }

  /**
   * Mappe une zone PLU/POS vers le zonage réglementaire
   */
  private mapZoneUrbaToZonage(typezone: string, destdomi?: string): ZonageReglementaire {
    const type = typezone.toUpperCase();

    // Vérifier d'abord la destination dominante (plus spécifique)
    if (destdomi && destdomi.toLowerCase().includes("activit")) {
      this.logger.debug("Zonage réglementaire: ZONE_VOCATION_ACTIVITES");
      return ZonageReglementaire.ZONE_VOCATION_ACTIVITES;
    }

    // Zone urbaine U
    if (type.startsWith("U")) {
      this.logger.debug("Zonage réglementaire: ZONE_URBAINE_U");
      return ZonageReglementaire.ZONE_URBAINE_U;
    }

    // Zone à urbaniser AU
    if (type.startsWith("AU")) {
      this.logger.debug("Zonage réglementaire: ZONE_A_URBANISER_AU");
      return ZonageReglementaire.ZONE_A_URBANISER_AU;
    }

    // Zone agricole A
    if (type.startsWith("A")) {
      this.logger.debug("Zonage réglementaire: ZONE_AGRICOLE_A");
      return ZonageReglementaire.ZONE_AGRICOLE_A;
    }

    // Zone naturelle N
    if (type.startsWith("N")) {
      this.logger.debug("Zonage réglementaire: ZONE_NATURELLE_N");
      return ZonageReglementaire.ZONE_NATURELLE_N;
    }

    this.logger.debug("Zonage réglementaire: NE_SAIT_PAS (type inconnu)");
    return ZonageReglementaire.NE_SAIT_PAS;
  }

  /**
   * Mappe un secteur de carte communale vers le zonage réglementaire
   */
  private mapSecteurCCToZonage(typesect: string): ZonageReglementaire {
    const type = typesect.toLowerCase();

    // Secteur constructible
    if (
      type.includes("constructible") &&
      !type.includes("non") &&
      !type.includes("inconstructible")
    ) {
      this.logger.debug("Zonage réglementaire: SECTEUR_OUVERT_A_LA_CONSTRUCTION");
      return ZonageReglementaire.SECTEUR_OUVERT_A_LA_CONSTRUCTION;
    }

    // Secteur non constructible
    if (type.includes("non") || type.includes("inconstructible") || type.includes("interdit")) {
      this.logger.debug("Zonage réglementaire: SECTEUR_NON_OUVERT_A_LA_CONSTRUCTION");
      return ZonageReglementaire.SECTEUR_NON_OUVERT_A_LA_CONSTRUCTION;
    }

    this.logger.debug("Zonage réglementaire: NE_SAIT_PAS (secteur inconnu)");
    return ZonageReglementaire.NE_SAIT_PAS;
  }
}
