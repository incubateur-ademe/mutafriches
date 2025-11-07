import { Injectable, Logger } from "@nestjs/common";
import { ZonageEnvironnemental } from "@mutafriches/shared-types";
import {
  ResultatNatura2000,
  ResultatZnieff,
  ResultatParcNaturel,
  ResultatReserveNaturelle,
} from "./zonage-environnemental.types";

/**
 * Calculator du sous-domaine Zonage Environnemental
 *
 * Contient toute la logique métier pure pour évaluer le zonage environnemental
 * basé sur les différentes protections (Natura 2000, ZNIEFF, PNR, etc.)
 *
 */
@Injectable()
export class ZonageEnvironnementalCalculator {
  private readonly logger = new Logger(ZonageEnvironnementalCalculator.name);

  /**
   * Évalue le zonage environnemental final
   *
   * Règles métier (par ordre de priorité) :
   * - Natura 2000 → NATURA_2000
   * - ZNIEFF (type 1 ou 2) → ZNIEFF_TYPE_1_2
   * - Parc Naturel National → PARC_NATUREL_NATIONAL
   * - Parc Naturel Régional → PARC_NATUREL_REGIONAL
   * - Réserve Naturelle → RESERVE_NATURELLE
   * - Sinon → HORS_ZONE
   *
   * @param natura2000 - Résultat détection Natura 2000
   * @param znieff - Résultat détection ZNIEFF
   * @param parcNaturel - Résultat détection Parc Naturel
   * @param reserveNaturelle - Résultat détection Réserve Naturelle
   * @returns Zonage environnemental final
   */
  evaluer(
    natura2000: ResultatNatura2000 | null,
    znieff: ResultatZnieff | null,
    parcNaturel: ResultatParcNaturel | null,
    reserveNaturelle: ResultatReserveNaturelle | null,
  ): ZonageEnvironnemental {
    // Priorité 1 : Natura 2000
    if (natura2000?.present) {
      this.logger.debug("Zonage environnemental: NATURA_2000");
      return ZonageEnvironnemental.NATURA_2000;
    }

    // Priorité 2 : ZNIEFF
    if (znieff?.present) {
      this.logger.debug("Zonage environnemental: ZNIEFF_TYPE_1_2");
      return ZonageEnvironnemental.ZNIEFF_TYPE_1_2;
    }

    // Priorité 3 : Parc Naturel
    if (parcNaturel?.present) {
      if (parcNaturel.type === "national") {
        this.logger.debug("Zonage environnemental: PARC_NATUREL_NATIONAL");
        return ZonageEnvironnemental.PARC_NATUREL_NATIONAL;
      }
      if (parcNaturel.type === "regional") {
        this.logger.debug("Zonage environnemental: PARC_NATUREL_REGIONAL");
        return ZonageEnvironnemental.PARC_NATUREL_REGIONAL;
      }
    }

    // Priorité 4 : Réserve Naturelle
    if (reserveNaturelle?.present) {
      this.logger.debug("Zonage environnemental: RESERVE_NATURELLE");
      return ZonageEnvironnemental.RESERVE_NATURELLE;
    }

    // Aucun zonage
    this.logger.debug("Zonage environnemental: HORS_ZONE");
    return ZonageEnvironnemental.HORS_ZONE;
  }
}
