import { Injectable, Logger } from "@nestjs/common";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { Parcelle } from "../../../evaluation/entities/parcelle.entity";
import { SisService } from "../../adapters/georisques/sis/sis.service";
import { IcpeService } from "../../adapters/georisques/icpe/icpe.service";
import { GEORISQUES_RAYONS_DEFAUT } from "../../adapters/georisques/georisques.constants";
import { EnrichmentResult } from "../shared/enrichissement.types";
import { RisquesTechnologiquesCalculator } from "./risques-technologiques.calculator";
import { EvaluationRisquesTechnologiques } from "./risques-technologiques.types";

/**
 * Service d'enrichissement du sous-domaine Risques Technologiques
 *
 * Responsabilités :
 * - Appeler les APIs GeoRisques (SIS + ICPE) en parallèle
 * - Utiliser le calculator pour évaluer les risques
 * - Enrichir la parcelle avec la présence de risques technologiques
 */
@Injectable()
export class RisquesTechnologiquesEnrichissementService {
  private readonly logger = new Logger(RisquesTechnologiquesEnrichissementService.name);

  constructor(
    private readonly sisService: SisService,
    private readonly icpeService: IcpeService,
    private readonly calculator: RisquesTechnologiquesCalculator,
  ) {}

  /**
   * Enrichit une parcelle avec les risques technologiques
   *
   * @param parcelle - Parcelle à enrichir (doit avoir des coordonnées)
   * @returns Résultat de l'enrichissement et évaluation détaillée
   */
  async enrichir(parcelle: Parcelle): Promise<{
    result: EnrichmentResult;
    evaluation: EvaluationRisquesTechnologiques;
  }> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];

    // Vérifier la présence des coordonnées
    if (!parcelle.coordonnees) {
      this.logger.warn(
        `Pas de coordonnees disponibles pour les risques technologiques - parcelle ${parcelle.identifiantParcelle}`,
      );
      sourcesEchouees.push(
        SourceEnrichissement.GEORISQUES_SIS,
        SourceEnrichissement.GEORISQUES_ICPE,
      );

      return {
        result: {
          success: false,
          sourcesUtilisees,
          sourcesEchouees,
        },
        evaluation: {
          sis: null,
          icpe: null,
          risqueFinal: false,
        },
      };
    }

    // Appeler SIS et ICPE en parallèle
    const [sisResult, icpeResult] = await Promise.allSettled([
      this.getSis(parcelle.coordonnees),
      this.getIcpe(parcelle.coordonnees),
    ]);

    // Traiter les résultats
    let presenceSis = false;
    let distanceIcpePlusProche: number | undefined;
    let sisData = null;
    let icpeData = null;

    // 1. Traiter SIS
    if (sisResult.status === "fulfilled" && sisResult.value) {
      presenceSis = sisResult.value.presenceSis;
      sisData = sisResult.value;
      sourcesUtilisees.push(SourceEnrichissement.GEORISQUES_SIS);
      this.logger.debug(`SIS recupere: presence=${presenceSis}`);
    } else {
      sourcesEchouees.push(SourceEnrichissement.GEORISQUES_SIS);
      this.logger.warn(
        `Echec recuperation SIS: ${sisResult.status === "rejected" ? sisResult.reason : "Aucune donnee"}`,
      );
    }

    // 2. Traiter ICPE
    if (icpeResult.status === "fulfilled" && icpeResult.value) {
      distanceIcpePlusProche = icpeResult.value.distancePlusProche;
      icpeData = icpeResult.value;
      sourcesUtilisees.push(SourceEnrichissement.GEORISQUES_ICPE);
      this.logger.debug(
        `ICPE recuperees: ${icpeResult.value.nombreIcpe} installations, ` +
          `plus proche: ${distanceIcpePlusProche !== undefined ? `${Math.round(distanceIcpePlusProche)}m` : "N/A"}`,
      );
    } else {
      sourcesEchouees.push(SourceEnrichissement.GEORISQUES_ICPE);
      this.logger.warn(
        `Echec recuperation ICPE: ${icpeResult.status === "rejected" ? icpeResult.reason : "Aucune donnee"}`,
      );
    }

    // 3. Évaluer les risques avec le calculator
    const risqueFinal = this.calculator.evaluer(presenceSis, distanceIcpePlusProche);
    parcelle.presenceRisquesTechnologiques = risqueFinal;

    this.logger.log(
      `Risques technologiques calcules pour ${parcelle.identifiantParcelle}: ` +
        `SIS=${presenceSis}, ICPE=${distanceIcpePlusProche !== undefined ? `${Math.round(distanceIcpePlusProche)}m` : "N/A"} → Final=${risqueFinal}`,
    );

    return {
      result: {
        success: sourcesUtilisees.length > 0,
        sourcesUtilisees,
        sourcesEchouees,
      },
      evaluation: {
        sis: sisData,
        icpe: icpeData,
        risqueFinal,
      },
    };
  }

  /**
   * Récupère les données SIS
   */
  private async getSis(coordonnees: {
    latitude: number;
    longitude: number;
  }): Promise<{ presenceSis: boolean } | null> {
    try {
      const result = await this.sisService.getSisByLatLon({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
        rayon: GEORISQUES_RAYONS_DEFAUT.SIS,
      });

      if (!result.success || !result.data) {
        return null;
      }

      return {
        presenceSis: result.data.presenceSis,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la recuperation SIS:", error);
      return null;
    }
  }

  /**
   * Récupère les données ICPE
   */
  private async getIcpe(coordonnees: { latitude: number; longitude: number }): Promise<{
    nombreIcpe: number;
    distancePlusProche?: number;
  } | null> {
    try {
      const result = await this.icpeService.getIcpeByLatLon({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
        rayon: GEORISQUES_RAYONS_DEFAUT.ICPE,
      });

      if (!result.success || !result.data) {
        return null;
      }

      return {
        nombreIcpe: result.data.nombreIcpe,
        distancePlusProche: result.data.distancePlusProche,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la recuperation ICPE:", error);
      return null;
    }
  }
}
