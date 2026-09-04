import { Injectable, Logger } from "@nestjs/common";
import { ZaerEnrichissement, ZoneAccelerationEnr } from "@mutafriches/shared-types";

// Mot discriminant du libellé APER "Interdiction ZAER (loi APER) toutes ENR sauf toiture"
const MOT_CLE_EXCLUSION = "INTERDICTION";

/**
 * Détermine si un zonage WFS correspond à une zone d'interdiction (loi APER).
 * Test sur le mot-clé et non sur le libellé complet, qui peut varier d'un millésime à l'autre.
 */
export function estZonageExclusion(zonage: string | null): boolean {
  if (!zonage) return false;

  return zonage.toUpperCase().includes(MOT_CLE_EXCLUSION);
}

/**
 * Calculateur du critère algorithmique ENR
 *
 * Dérive la valeur du critère `zoneAccelerationEnr` à partir des données ZAER brutes.
 *
 * Règles de classification :
 * 1. Zone d'interdiction APER → EXCLUSION (prioritaire : l'interdiction prime sur
 *    une éventuelle zone d'accélération recouvrant le site)
 * 2. Pas de données ZAER ou enZoneZaer === false → NON
 * 3. Si un detailFiliere contient "OMBRIERE" → OUI_SOLAIRE_PV_OMBRIERE
 * 4. Sinon → OUI
 */
@Injectable()
export class EnrCalculator {
  private readonly logger = new Logger(EnrCalculator.name);

  evaluer(zaer: ZaerEnrichissement | undefined): ZoneAccelerationEnr {
    if (zaer?.enZoneExclusion) {
      this.logger.debug("Zone accélération ENR: EXCLUSION (zone d'interdiction APER)");
      return ZoneAccelerationEnr.EXCLUSION;
    }

    if (!zaer || !zaer.enZoneZaer) {
      this.logger.debug("Zone accélération ENR: NON (pas en zone ZAER)");
      return ZoneAccelerationEnr.NON;
    }

    // Chercher une zone avec PV ombrière dans les détails filière
    const hasOmbriere = zaer.zones.some(
      (zone) => zone.detailFiliere && zone.detailFiliere.toUpperCase().includes("OMBRIERE"),
    );

    if (hasOmbriere) {
      this.logger.debug("Zone accélération ENR: OUI_SOLAIRE_PV_OMBRIERE");
      return ZoneAccelerationEnr.OUI_SOLAIRE_PV_OMBRIERE;
    }

    this.logger.debug("Zone accélération ENR: OUI");
    return ZoneAccelerationEnr.OUI;
  }
}
