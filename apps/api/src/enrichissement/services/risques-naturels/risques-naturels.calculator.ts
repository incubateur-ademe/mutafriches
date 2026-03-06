import { Injectable, Logger } from "@nestjs/common";
import {
  RisqueRetraitGonflementArgile,
  RisqueCavitesSouterraines,
  RisqueInondation,
} from "@mutafriches/shared-types";
import { CavitesResultNormalized } from "../../adapters/georisques/cavites/cavites.types";

/**
 * Calculator du sous-domaine Risques Naturels
 *
 * Contient toute la logique métier pure pour :
 * - Évaluer le risque retrait gonflement argile (RGA)
 * - Évaluer le risque cavités souterraines
 * - Évaluer le risque inondation (TRI/AZI/PAPI/PPR)
 *
 * Toutes les méthodes sont pures (sans effets de bord) pour faciliter les tests
 */
@Injectable()
export class RisquesNaturelsCalculator {
  private readonly logger = new Logger(RisquesNaturelsCalculator.name);

  /**
   * Transforme le niveau d'aléa RGA en risque retrait gonflement argile
   *
   * @param alea - Niveau d'aléa RGA (ex: "Fort", "Moyen", "Faible", "Nul")
   * @returns Niveau de risque correspondant
   */
  transformRgaToRisque(alea: string): RisqueRetraitGonflementArgile {
    const aleaNormalise = alea.toLowerCase().trim();

    if (aleaNormalise.includes("fort") || aleaNormalise === "fort") {
      return RisqueRetraitGonflementArgile.FORT;
    } else if (
      aleaNormalise.includes("moyen") ||
      aleaNormalise === "moyen" ||
      aleaNormalise.includes("faible") ||
      aleaNormalise === "faible"
    ) {
      return RisqueRetraitGonflementArgile.FAIBLE_OU_MOYEN;
    }

    return RisqueRetraitGonflementArgile.AUCUN;
  }

  /**
   * Transforme les données cavités en risque cavités souterraines
   * Basé sur la distance de la cavité la plus proche
   *
   * Règle : OUI si cavité détectée à moins de 500m, NON sinon
   *
   * @param cavitesData - Données normalisées des cavités
   * @returns Risque cavités souterraines
   */
  transformCavitesToRisque(cavitesData: CavitesResultNormalized): RisqueCavitesSouterraines {
    if (!cavitesData.exposition || cavitesData.nombreCavites === 0) {
      return RisqueCavitesSouterraines.NON;
    }

    const distancePlusProche = cavitesData.distancePlusProche;

    if (distancePlusProche === undefined) {
      return RisqueCavitesSouterraines.NON;
    }

    // OUI seulement si cavité à moins de 500m
    if (distancePlusProche <= 500) {
      return RisqueCavitesSouterraines.OUI;
    }

    return RisqueCavitesSouterraines.NON;
  }

  /**
   * Évalue le risque inondation à partir des données TRI/AZI/PAPI/PPR
   *
   * @param tri - Présence dans un Territoire à Risques importants d'Inondation
   * @param azi - Présence dans un Atlas des Zones Inondables
   * @param papi - Présence d'un Programme d'Actions de Prévention des Inondations
   * @param ppr - Présence d'un Plan de Prévention des Risques
   * @returns Risque inondation (OUI si au moins un est présent)
   */
  evaluerInondation(tri: boolean, azi: boolean, papi: boolean, ppr: boolean): RisqueInondation {
    if (tri || azi || papi || ppr) {
      return RisqueInondation.OUI;
    }
    return RisqueInondation.NON;
  }
}
