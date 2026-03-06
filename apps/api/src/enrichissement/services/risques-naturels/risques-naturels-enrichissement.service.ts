import { Injectable, Logger } from "@nestjs/common";
import {
  SourceEnrichissement,
  RisqueRetraitGonflementArgile,
  RisqueCavitesSouterraines,
  RisqueInondation,
} from "@mutafriches/shared-types";
import { Site } from "../../../evaluation/entities/site.entity";
import { RgaService } from "../../adapters/georisques/rga/rga.service";
import { CavitesService } from "../../adapters/georisques/cavites/cavites.service";
import { TriService } from "../../adapters/georisques/tri/tri.service";
import { AziService } from "../../adapters/georisques/azi/azi.service";
import { PapiService } from "../../adapters/georisques/papi/papi.service";
import { PprService } from "../../adapters/georisques/ppr/ppr.service";
import { GEORISQUES_RAYONS_DEFAUT } from "../../adapters/georisques/georisques.constants";
import { EnrichmentResult } from "../shared/enrichissement.types";
import { RisquesNaturelsCalculator } from "./risques-naturels.calculator";
import { EvaluationRisquesNaturels } from "./risques-naturels.types";

/**
 * Service d'enrichissement du sous-domaine Risques Naturels
 *
 * Responsabilités :
 * - Appeler les APIs GeoRisques (RGA + Cavités + TRI + AZI + PAPI + PPR) en parallèle
 * - Utiliser le calculator pour évaluer 3 critères de risque séparés :
 *   1. Retrait gonflement argile (RGA)
 *   2. Cavités souterraines
 *   3. Inondation (TRI/AZI/PAPI/PPR)
 * - Enrichir le site avec les 3 niveaux de risque
 */
@Injectable()
export class RisquesNaturelsEnrichissementService {
  private readonly logger = new Logger(RisquesNaturelsEnrichissementService.name);

  constructor(
    private readonly rgaService: RgaService,
    private readonly cavitesService: CavitesService,
    private readonly triService: TriService,
    private readonly aziService: AziService,
    private readonly papiService: PapiService,
    private readonly pprService: PprService,
    private readonly calculator: RisquesNaturelsCalculator,
  ) {}

  /**
   * Enrichit un site avec les 3 critères de risques naturels
   *
   * @param site - Site à enrichir (doit avoir des coordonnées)
   * @returns Résultat de l'enrichissement et évaluation détaillée
   */
  async enrichir(site: Site): Promise<{
    result: EnrichmentResult;
    evaluation: EvaluationRisquesNaturels;
  }> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];

    // Vérifier la présence des coordonnées
    if (!site.coordonnees) {
      this.logger.warn(
        `Pas de coordonnees disponibles pour les risques naturels - site ${site.identifiantParcelle}`,
      );
      sourcesEchouees.push(
        SourceEnrichissement.GEORISQUES_RGA,
        SourceEnrichissement.GEORISQUES_CAVITES,
        SourceEnrichissement.GEORISQUES_TRI,
        SourceEnrichissement.GEORISQUES_AZI,
        SourceEnrichissement.GEORISQUES_PAPI,
        SourceEnrichissement.GEORISQUES_PPR,
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
          inondation: null,
          risqueRetraitGonflementArgile: RisqueRetraitGonflementArgile.AUCUN,
          risqueCavitesSouterraines: RisqueCavitesSouterraines.NON,
          risqueInondation: RisqueInondation.NON,
        },
      };
    }

    // Appeler les 6 APIs en parallèle
    const [rgaResult, cavitesResult, triResult, aziResult, papiResult, pprResult] =
      await Promise.allSettled([
        this.getRga(site.coordonnees),
        this.getCavites(site.coordonnees),
        this.getTri(site.coordonnees),
        this.getAzi(site.coordonnees),
        this.getPapi(site.coordonnees),
        this.getPpr(site.coordonnees),
      ]);

    // --- 1. Traiter RGA ---
    let risqueRga = RisqueRetraitGonflementArgile.AUCUN;
    let rgaData = null;

    if (rgaResult.status === "fulfilled" && rgaResult.value) {
      risqueRga = rgaResult.value.risque;
      rgaData = rgaResult.value;
      sourcesUtilisees.push(SourceEnrichissement.GEORISQUES_RGA);
      this.logger.debug(`RGA recupere: ${rgaResult.value.alea} -> ${risqueRga}`);
    } else {
      sourcesEchouees.push(SourceEnrichissement.GEORISQUES_RGA);
      this.logger.warn(
        `Echec recuperation RGA: ${rgaResult.status === "rejected" ? (rgaResult.reason as string) : "Aucune donnee"}`,
      );
    }

    // --- 2. Traiter Cavités ---
    let risqueCavites = RisqueCavitesSouterraines.NON;
    let cavitesData = null;

    if (cavitesResult.status === "fulfilled" && cavitesResult.value) {
      risqueCavites = cavitesResult.value.risque;
      cavitesData = cavitesResult.value;
      sourcesUtilisees.push(SourceEnrichissement.GEORISQUES_CAVITES);
      this.logger.debug(
        `Cavites recuperees: ${cavitesResult.value.nombreCavites} cavites, ` +
          `plus proche: ${cavitesResult.value.distancePlusProche ? `${Math.round(cavitesResult.value.distancePlusProche)}m` : "N/A"} -> ${risqueCavites}`,
      );
    } else {
      sourcesEchouees.push(SourceEnrichissement.GEORISQUES_CAVITES);
      this.logger.warn(
        `Echec recuperation Cavites: ${cavitesResult.status === "rejected" ? (cavitesResult.reason as string) : "Aucune donnee"}`,
      );
    }

    // --- 3. Traiter Inondation (TRI/AZI/PAPI/PPR) ---
    let triExposition = false;
    let aziExposition = false;
    let papiExposition = false;
    let pprExposition = false;

    if (triResult.status === "fulfilled") {
      triExposition = triResult.value;
      sourcesUtilisees.push(SourceEnrichissement.GEORISQUES_TRI);
    } else {
      sourcesEchouees.push(SourceEnrichissement.GEORISQUES_TRI);
    }

    if (aziResult.status === "fulfilled") {
      aziExposition = aziResult.value;
      sourcesUtilisees.push(SourceEnrichissement.GEORISQUES_AZI);
    } else {
      sourcesEchouees.push(SourceEnrichissement.GEORISQUES_AZI);
    }

    if (papiResult.status === "fulfilled") {
      papiExposition = papiResult.value;
      sourcesUtilisees.push(SourceEnrichissement.GEORISQUES_PAPI);
    } else {
      sourcesEchouees.push(SourceEnrichissement.GEORISQUES_PAPI);
    }

    if (pprResult.status === "fulfilled") {
      pprExposition = pprResult.value;
      sourcesUtilisees.push(SourceEnrichissement.GEORISQUES_PPR);
    } else {
      sourcesEchouees.push(SourceEnrichissement.GEORISQUES_PPR);
    }

    const risqueInondation = this.calculator.evaluerInondation(
      triExposition,
      aziExposition,
      papiExposition,
      pprExposition,
    );

    // Appliquer les 3 critères sur le site
    site.risqueRetraitGonflementArgile = risqueRga;
    site.risqueCavitesSouterraines = risqueCavites;
    site.risqueInondation = risqueInondation;

    this.logger.log(
      `Risques naturels calcules pour ${site.identifiantParcelle}: ` +
        `RGA=${risqueRga}, Cavites=${risqueCavites}, Inondation=${risqueInondation}`,
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
        inondation: {
          tri: triExposition,
          azi: aziExposition,
          papi: papiExposition,
          ppr: pprExposition,
          risque: risqueInondation,
        },
        risqueRetraitGonflementArgile: risqueRga,
        risqueCavitesSouterraines: risqueCavites,
        risqueInondation,
      },
    };
  }

  /**
   * Récupère et transforme les données RGA
   */
  private async getRga(coordonnees: {
    latitude: number;
    longitude: number;
  }): Promise<{ alea: string; risque: RisqueRetraitGonflementArgile } | null> {
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
    risque: RisqueCavitesSouterraines;
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

  /**
   * Récupère l'exposition TRI (Territoires à Risques importants d'Inondation)
   */
  private async getTri(coordonnees: { latitude: number; longitude: number }): Promise<boolean> {
    try {
      const result = await this.triService.getTri({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
      });
      return result.success && result.data ? result.data.exposition : false;
    } catch (error) {
      this.logger.error("Erreur lors de la recuperation TRI:", error);
      throw error;
    }
  }

  /**
   * Récupère l'exposition AZI (Atlas des Zones Inondables)
   */
  private async getAzi(coordonnees: { latitude: number; longitude: number }): Promise<boolean> {
    try {
      const result = await this.aziService.getAzi({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
      });
      return result.success && result.data ? result.data.exposition : false;
    } catch (error) {
      this.logger.error("Erreur lors de la recuperation AZI:", error);
      throw error;
    }
  }

  /**
   * Récupère l'exposition PAPI (Programmes d'Actions de Prévention des Inondations)
   */
  private async getPapi(coordonnees: { latitude: number; longitude: number }): Promise<boolean> {
    try {
      const result = await this.papiService.getPapi({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
      });
      return result.success && result.data ? result.data.exposition : false;
    } catch (error) {
      this.logger.error("Erreur lors de la recuperation PAPI:", error);
      throw error;
    }
  }

  /**
   * Récupère l'exposition PPR (Plans de Prévention des Risques)
   */
  private async getPpr(coordonnees: { latitude: number; longitude: number }): Promise<boolean> {
    try {
      const result = await this.pprService.getPpr({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
      });
      return result.success && result.data ? result.data.exposition : false;
    } catch (error) {
      this.logger.error("Erreur lors de la recuperation PPR:", error);
      throw error;
    }
  }
}
