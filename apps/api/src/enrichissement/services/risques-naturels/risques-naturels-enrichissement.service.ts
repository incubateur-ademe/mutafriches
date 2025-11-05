import { Injectable, Logger } from "@nestjs/common";
import { RisqueNaturel, SourceEnrichissement } from "@mutafriches/shared-types";
import { Parcelle } from "../../../evaluation/entities/parcelle.entity";
import { RgaService } from "../external/georisques/rga/rga.service";
import { CavitesService } from "../external/georisques/cavites/cavites.service";
import { GEORISQUES_RAYONS_DEFAUT } from "../external/georisques/georisques.constants";
import { EnrichmentResult } from "../shared/enrichissement.types";
import { RisquesNaturelsCalculator } from "./risques-naturels.calculator";
import { EvaluationRisquesNaturels } from "./risques-naturels.types";

/**
 * Service d'enrichissement du sous-domaine Risques Naturels
 *
 * Responsabilités :
 * - Appeler les APIs GeoRisques (RGA + Cavités) en parallèle
 * - Utiliser le calculator pour combiner les risques
 * - Enrichir la parcelle avec le niveau de risque final
 */
@Injectable()
export class RisquesNaturelsEnrichissementService {
  private readonly logger = new Logger(RisquesNaturelsEnrichissementService.name);

  constructor(
    private readonly rgaService: RgaService,
    private readonly cavitesService: CavitesService,
    private readonly calculator: RisquesNaturelsCalculator,
  ) {}

  /**
   * Enrichit une parcelle avec les risques naturels
   *
   * @param parcelle - Parcelle à enrichir (doit avoir des coordonnées)
   * @returns Résultat de l'enrichissement et évaluation détaillée
   */
  async enrichir(parcelle: Parcelle): Promise<{
    result: EnrichmentResult;
    evaluation: EvaluationRisquesNaturels;
  }> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];

    // Vérifier la présence des coordonnées
    if (!parcelle.coordonnees) {
      this.logger.warn(
        `Pas de coordonnees disponibles pour les risques naturels - parcelle ${parcelle.identifiantParcelle}`,
      );
      sourcesEchouees.push(
        SourceEnrichissement.GEORISQUES_RGA,
        SourceEnrichissement.GEORISQUES_CAVITES,
      );

      return {
        result: {
          success: false,
          sourcesUtilisees,
          sourcesEchouees,
        },
        evaluation: {
          rga: null,
          cavites: null,
          risqueFinal: RisqueNaturel.AUCUN,
        },
      };
    }

    // Appeler RGA et Cavités en parallèle
    const [rgaResult, cavitesResult] = await Promise.allSettled([
      this.getRga(parcelle.coordonnees),
      this.getCavites(parcelle.coordonnees),
    ]);

    // Traiter les résultats
    let aleaRga: RisqueNaturel = RisqueNaturel.AUCUN;
    let aleaCavites: RisqueNaturel = RisqueNaturel.AUCUN;
    let rgaData = null;
    let cavitesData = null;

    // 1. Traiter RGA
    if (rgaResult.status === "fulfilled" && rgaResult.value) {
      aleaRga = rgaResult.value.risque;
      rgaData = rgaResult.value;
      sourcesUtilisees.push(SourceEnrichissement.GEORISQUES_RGA);
      this.logger.debug(`RGA recupere: ${rgaResult.value.alea} → ${aleaRga}`);
    } else {
      sourcesEchouees.push(SourceEnrichissement.GEORISQUES_RGA);
      this.logger.warn(
        `Echec recuperation RGA: ${rgaResult.status === "rejected" ? rgaResult.reason : "Aucune donnee"}`,
      );
    }

    // 2. Traiter Cavités
    if (cavitesResult.status === "fulfilled" && cavitesResult.value) {
      aleaCavites = cavitesResult.value.risque;
      cavitesData = cavitesResult.value;
      sourcesUtilisees.push(SourceEnrichissement.GEORISQUES_CAVITES);
      this.logger.debug(
        `Cavites recuperees: ${cavitesResult.value.nombreCavites} cavites, ` +
          `plus proche: ${cavitesResult.value.distancePlusProche ? `${Math.round(cavitesResult.value.distancePlusProche)}m` : "N/A"} → ${aleaCavites}`,
      );
    } else {
      sourcesEchouees.push(SourceEnrichissement.GEORISQUES_CAVITES);
      this.logger.warn(
        `Echec recuperation Cavites: ${cavitesResult.status === "rejected" ? cavitesResult.reason : "Aucune donnee"}`,
      );
    }

    // 3. Combiner les risques avec le calculator
    const risqueFinal = this.calculator.combiner(aleaRga, aleaCavites);
    parcelle.presenceRisquesNaturels = risqueFinal;

    this.logger.log(
      `Risques naturels calcules pour ${parcelle.identifiantParcelle}: ` +
        `RGA=${aleaRga}, Cavites=${aleaCavites} → Final=${risqueFinal}`,
    );

    return {
      result: {
        success: sourcesUtilisees.length > 0,
        sourcesUtilisees,
        sourcesEchouees,
      },
      evaluation: {
        rga: rgaData,
        cavites: cavitesData,
        risqueFinal,
      },
    };
  }

  /**
   * Récupère et transforme les données RGA
   */
  private async getRga(coordonnees: {
    latitude: number;
    longitude: number;
  }): Promise<{ alea: string; risque: RisqueNaturel } | null> {
    try {
      const result = await this.rgaService.getRga({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
      });

      if (!result.success || !result.data) {
        return null;
      }

      const risque = this.calculator.transformRgaToRisque(result.data.alea);

      return {
        alea: result.data.alea,
        risque,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la recuperation RGA:", error);
      return null;
    }
  }

  /**
   * Récupère et transforme les données Cavités
   */
  private async getCavites(coordonnees: { latitude: number; longitude: number }): Promise<{
    exposition: boolean;
    nombreCavites: number;
    distancePlusProche?: number;
    risque: RisqueNaturel;
  } | null> {
    try {
      const result = await this.cavitesService.getCavites({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
        rayon: GEORISQUES_RAYONS_DEFAUT.CAVITES,
      });

      if (!result.success || !result.data) {
        return null;
      }

      const risque = this.calculator.transformCavitesToRisque(result.data);

      return {
        exposition: result.data.exposition,
        nombreCavites: result.data.nombreCavites,
        distancePlusProche: result.data.distancePlusProche,
        risque,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la recuperation Cavites:", error);
      return null;
    }
  }
}
