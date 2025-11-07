import { Injectable, Logger } from "@nestjs/common";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { ApiCartoNatureService } from "../../../adapters/api-carto/nature/api-carto-nature.service";
import { ParcelleGeometry } from "../../shared/geometry.types";
import { EnrichmentResult } from "../../shared/enrichissement.types";
import { ZonageEnvironnementalCalculator } from "./zonage-environnemental.calculator";
import {
  EvaluationZonageEnvironnemental,
  ResultatNatura2000,
  ResultatZnieff,
  ResultatParcNaturel,
  ResultatReserveNaturelle,
} from "./zonage-environnemental.types";

/**
 * Service d'enrichissement du sous-domaine Zonage Environnemental
 *
 * Responsabilités :
 * - Appeler les APIs API Carto Nature en parallèle
 * - Transformer les réponses API en résultats structurés
 * - Utiliser le calculator pour évaluer le zonage final
 */
@Injectable()
export class ZonageEnvironnementalService {
  private readonly logger = new Logger(ZonageEnvironnementalService.name);

  constructor(
    private readonly apiCartoNatureService: ApiCartoNatureService,
    private readonly calculator: ZonageEnvironnementalCalculator,
  ) {}

  /**
   * Enrichit avec le zonage environnemental
   *
   * @param geometry - Géométrie de la parcelle
   * @returns Résultat de l'enrichissement et évaluation détaillée
   */
  async enrichir(geometry: ParcelleGeometry): Promise<{
    result: EnrichmentResult;
    evaluation: EvaluationZonageEnvironnemental;
  }> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];

    // Appeler toutes les APIs en parallèle
    const [natura2000Result, znieffResult, parcNaturelResult, reserveResult] =
      await Promise.allSettled([
        this.getNatura2000(geometry),
        this.getZnieff(geometry),
        this.getParcNaturel(geometry),
        this.getReserveNaturelle(geometry),
      ]);

    // Traiter les résultats
    let natura2000Data: ResultatNatura2000 | null = null;
    let znieffData: ResultatZnieff | null = null;
    let parcNaturelData: ResultatParcNaturel | null = null;
    let reserveData: ResultatReserveNaturelle | null = null;

    // 1. Traiter Natura 2000
    if (natura2000Result.status === "fulfilled" && natura2000Result.value) {
      natura2000Data = natura2000Result.value;
      sourcesUtilisees.push(SourceEnrichissement.API_CARTO_NATURE);
      this.logger.debug(
        `Natura 2000: ${natura2000Data.present ? `${natura2000Data.nombreZones} zone(s)` : "aucune"}`,
      );
    } else {
      sourcesEchouees.push(SourceEnrichissement.API_CARTO_NATURE);
    }

    // 2. Traiter ZNIEFF
    if (znieffResult.status === "fulfilled" && znieffResult.value) {
      znieffData = znieffResult.value;
      if (!sourcesUtilisees.includes(SourceEnrichissement.API_CARTO_NATURE)) {
        sourcesUtilisees.push(SourceEnrichissement.API_CARTO_NATURE);
      }
      this.logger.debug(
        `ZNIEFF: ${znieffData.present ? `${znieffData.nombreZones} zone(s)` : "aucune"}`,
      );
    }

    // 3. Traiter Parc Naturel
    if (parcNaturelResult.status === "fulfilled" && parcNaturelResult.value) {
      parcNaturelData = parcNaturelResult.value;
      if (!sourcesUtilisees.includes(SourceEnrichissement.API_CARTO_NATURE)) {
        sourcesUtilisees.push(SourceEnrichissement.API_CARTO_NATURE);
      }
      this.logger.debug(
        `Parc naturel: ${parcNaturelData.present ? parcNaturelData.type : "aucun"}`,
      );
    }

    // 4. Traiter Réserve Naturelle
    if (reserveResult.status === "fulfilled" && reserveResult.value) {
      reserveData = reserveResult.value;
      if (!sourcesUtilisees.includes(SourceEnrichissement.API_CARTO_NATURE)) {
        sourcesUtilisees.push(SourceEnrichissement.API_CARTO_NATURE);
      }
      this.logger.debug(
        `Réserve naturelle: ${reserveData.present ? `${reserveData.nombreReserves} réserve(s)` : "aucune"}`,
      );
    }

    // 5. Évaluer le zonage final avec le calculator
    const zonageFinal = this.calculator.evaluer(
      natura2000Data,
      znieffData,
      parcNaturelData,
      reserveData,
    );

    this.logger.log(`Zonage environnemental final: ${zonageFinal}`);

    return {
      result: {
        success: sourcesUtilisees.length > 0,
        sourcesUtilisees,
        sourcesEchouees,
      },
      evaluation: {
        natura2000: natura2000Data,
        znieff: znieffData,
        parcNaturel: parcNaturelData,
        reserveNaturelle: reserveData,
        zonageFinal,
      },
    };
  }

  private async getNatura2000(geometry: ParcelleGeometry): Promise<ResultatNatura2000 | null> {
    try {
      const [habitats, oiseaux] = await Promise.all([
        this.apiCartoNatureService.queryNatura2000Habitats(geometry),
        this.apiCartoNatureService.queryNatura2000Oiseaux(geometry),
      ]);

      const totalZones =
        (habitats.success && habitats.data ? habitats.data.totalFeatures : 0) +
        (oiseaux.success && oiseaux.data ? oiseaux.data.totalFeatures : 0);

      return {
        present: totalZones > 0,
        nombreZones: totalZones,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la recuperation Natura 2000:", error);
      return null;
    }
  }

  private async getZnieff(geometry: ParcelleGeometry): Promise<ResultatZnieff | null> {
    try {
      const [znieff1, znieff2] = await Promise.all([
        this.apiCartoNatureService.queryZnieff1(geometry),
        this.apiCartoNatureService.queryZnieff2(geometry),
      ]);

      const nbZnieff1 = znieff1.success && znieff1.data ? znieff1.data.totalFeatures : 0;
      const nbZnieff2 = znieff2.success && znieff2.data ? znieff2.data.totalFeatures : 0;

      return {
        present: nbZnieff1 > 0 || nbZnieff2 > 0,
        type1: nbZnieff1 > 0,
        type2: nbZnieff2 > 0,
        nombreZones: nbZnieff1 + nbZnieff2,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la recuperation ZNIEFF:", error);
      return null;
    }
  }

  private async getParcNaturel(geometry: ParcelleGeometry): Promise<ResultatParcNaturel | null> {
    try {
      const pnr = await this.apiCartoNatureService.queryParcNaturelRegional(geometry);

      if (pnr.success && pnr.data && pnr.data.totalFeatures > 0) {
        return {
          present: true,
          type: "regional",
          nom: pnr.data.features[0]?.properties?.nom,
        };
      }

      // TODO: Ajouter la détection des Parcs Nationaux via INPN WFS
      return {
        present: false,
        type: null,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la recuperation Parc Naturel:", error);
      return null;
    }
  }

  private async getReserveNaturelle(
    geometry: ParcelleGeometry,
  ): Promise<ResultatReserveNaturelle | null> {
    try {
      const reserves = await this.apiCartoNatureService.queryReservesNaturelles(geometry);

      const nbReserves = reserves.success && reserves.data ? reserves.data.totalFeatures : 0;

      return {
        present: nbReserves > 0,
        nombreReserves: nbReserves,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la recuperation Reserves Naturelles:", error);
      return null;
    }
  }
}
