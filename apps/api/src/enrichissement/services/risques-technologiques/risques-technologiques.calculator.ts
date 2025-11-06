import { Injectable, Logger } from "@nestjs/common";

/**
 * Calculator du sous-domaine Risques Technologiques
 *
 * Contient toute la logique métier pure pour évaluer les risques technologiques
 * basés sur la présence de SIS et la proximité d'ICPE.
 *
 * Toutes les méthodes sont pures (sans effets de bord) pour faciliter les tests
 */
@Injectable()
export class RisquesTechnologiquesCalculator {
  private readonly logger = new Logger(RisquesTechnologiquesCalculator.name);

  /**
   * Seuil de distance pour considérer un risque ICPE (en mètres)
   */
  private readonly SEUIL_DISTANCE_ICPE = 500;

  /**
   * Évalue la présence de risques technologiques
   *
   * Règles métier :
   * - Si présence SIS → OUI (risque avéré)
   * - Si ICPE à moins de 500m → OUI (risque de proximité)
   * - Sinon → NON
   *
   * @param presenceSis - Présence d'un site SIS
   * @param distanceIcpePlusProche - Distance en mètres de l'ICPE la plus proche (undefined si aucune)
   * @returns true si risque technologique présent, false sinon
   */
  evaluer(presenceSis: boolean, distanceIcpePlusProche?: number): boolean {
    // Risque si présence SIS
    if (presenceSis) {
      this.logger.debug("Risque technologique: OUI (presence SIS)");
      return true;
    }

    // Risque si ICPE à moins de 500m
    if (
      distanceIcpePlusProche !== undefined &&
      distanceIcpePlusProche <= this.SEUIL_DISTANCE_ICPE
    ) {
      this.logger.debug(
        `Risque technologique: OUI (ICPE a ${Math.round(distanceIcpePlusProche)}m)`,
      );
      return true;
    }

    // Pas de risque
    this.logger.debug(
      `Risque technologique: NON (pas de SIS, ICPE a ${distanceIcpePlusProche !== undefined ? `${Math.round(distanceIcpePlusProche)}m` : "N/A"})`,
    );
    return false;
  }

  /**
   * Retourne le seuil de distance ICPE utilisé
   */
  getSeuilDistanceIcpe(): number {
    return this.SEUIL_DISTANCE_ICPE;
  }
}
