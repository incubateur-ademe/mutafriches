import { Injectable, Logger } from "@nestjs/common";
import { RisqueNaturel } from "@mutafriches/shared-types";
import { CavitesResultNormalized } from "../../adapters/georisques/cavites/cavites.types";

/**
 * Calculator du sous-domaine Risques Naturels
 *
 * Contient toute la logique métier pure pour :
 * - Combiner les risques RGA et Cavités
 * - Transformer les aléas en niveaux de risque
 *
 * Toutes les méthodes sont pures (sans effets de bord) pour faciliter les tests
 */
@Injectable()
export class RisquesNaturelsCalculator {
  private readonly logger = new Logger(RisquesNaturelsCalculator.name);

  /**
   * Combine les risques RGA et Cavités selon les règles métier
   *
   * Règles de combinaison :
   * - Si un des deux est FORT et l'autre est FORT ou MOYEN → FORT
   * - Si un des deux est FORT et l'autre est FAIBLE ou AUCUN → MOYEN
   * - Si au moins un est MOYEN → MOYEN
   * - Si les deux sont FAIBLE ou (un FAIBLE + un AUCUN) → FAIBLE
   * - Sinon → AUCUN
   *
   * @param aleaRga - Niveau de risque RGA
   * @param aleaCavites - Niveau de risque Cavités
   * @returns Niveau de risque final combiné
   */
  combiner(aleaRga: RisqueNaturel, aleaCavites: RisqueNaturel): RisqueNaturel {
    // Convertir en valeurs numériques pour simplifier les comparaisons
    const niveaux = {
      [RisqueNaturel.AUCUN]: 0,
      [RisqueNaturel.FAIBLE]: 1,
      [RisqueNaturel.MOYEN]: 2,
      [RisqueNaturel.FORT]: 3,
    };

    const niveauRga = niveaux[aleaRga];
    const niveauCavites = niveaux[aleaCavites];
    const niveauMax = Math.max(niveauRga, niveauCavites);
    const niveauMin = Math.min(niveauRga, niveauCavites);

    let risqueFinal: RisqueNaturel;

    // Si un des deux est FORT
    if (niveauMax === 3) {
      // FORT + FORT ou FORT + MOYEN → FORT
      if (niveauMin >= 2) {
        risqueFinal = RisqueNaturel.FORT;
      } else {
        // FORT + FAIBLE ou FORT + AUCUN → MOYEN
        risqueFinal = RisqueNaturel.MOYEN;
      }
    }
    // Si au moins un est MOYEN → MOYEN
    else if (niveauMax === 2) {
      risqueFinal = RisqueNaturel.MOYEN;
    }
    // Si au moins un est FAIBLE → FAIBLE
    else if (niveauMax === 1) {
      risqueFinal = RisqueNaturel.FAIBLE;
    }
    // Les deux sont AUCUN → AUCUN
    else {
      risqueFinal = RisqueNaturel.AUCUN;
    }

    this.logger.debug(
      `Combinaison risques naturels: RGA=${aleaRga}, Cavites=${aleaCavites} → Final=${risqueFinal}`,
    );

    return risqueFinal;
  }

  /**
   * Transforme le niveau d'aléa RGA en risque naturel
   *
   * @param alea - Niveau d'aléa RGA (ex: "Fort", "Moyen", "Faible")
   * @returns Niveau de risque naturel correspondant
   */
  transformRgaToRisque(alea: string): RisqueNaturel {
    const aleaNormalise = alea.toLowerCase().trim();

    if (aleaNormalise.includes("fort") || aleaNormalise === "fort") {
      return RisqueNaturel.FORT;
    } else if (aleaNormalise.includes("moyen") || aleaNormalise === "moyen") {
      return RisqueNaturel.MOYEN;
    } else if (aleaNormalise.includes("faible") || aleaNormalise === "faible") {
      return RisqueNaturel.FAIBLE;
    }

    return RisqueNaturel.AUCUN;
  }

  /**
   * Transforme les données cavités en risque naturel
   * Basé sur la distance de la cavité la plus proche
   *
   * Règles de calcul :
   * - Aucune cavité détectée → AUCUN
   * - Cavité à moins de 500m → FORT
   * - Cavité entre 500m et 1000m → MOYEN
   * - Cavité à plus de 1000m → FAIBLE
   *
   * @param cavitesData - Données normalisées des cavités
   * @returns Niveau de risque naturel correspondant
   */
  transformCavitesToRisque(cavitesData: CavitesResultNormalized): RisqueNaturel {
    // Si aucune cavité détectée
    if (!cavitesData.exposition || cavitesData.nombreCavites === 0) {
      return RisqueNaturel.AUCUN;
    }

    const distancePlusProche = cavitesData.distancePlusProche;

    // Si on n'a pas de distance, on considère aucun risque par défaut
    if (distancePlusProche === undefined) {
      return RisqueNaturel.AUCUN;
    }

    // Règles de calcul basées sur la distance de la cavité la plus proche
    if (distancePlusProche <= 500) {
      // Cavité à moins de 500m
      return RisqueNaturel.FORT;
    } else if (distancePlusProche <= 1000) {
      // Cavité entre 500m et 1000m
      return RisqueNaturel.MOYEN;
    } else {
      // Cavité supérieure à 1000m
      return RisqueNaturel.FAIBLE;
    }
  }
}
