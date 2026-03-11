import { Injectable, Logger } from "@nestjs/common";
import { ZaerEnrichissement, ZoneAccelerationEnr } from "@mutafriches/shared-types";

/**
 * Calculateur du critère algorithmique ENR
 *
 * Dérive la valeur du critère `zoneAccelerationEnr` à partir des données ZAER brutes.
 *
 * Règles de classification :
 * 1. Pas de données ZAER ou enZoneZaer === false → NON
 * 2. Si un detailFiliere contient "OMBRIERE" → OUI_SOLAIRE_PV_OMBRIERE
 * 3. Sinon → OUI
 */
@Injectable()
export class EnrCalculator {
  private readonly logger = new Logger(EnrCalculator.name);

  evaluer(zaer: ZaerEnrichissement | undefined): ZoneAccelerationEnr {
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
