import { Injectable, Logger } from "@nestjs/common";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { GeoRisquesResult } from "../../adapters/georisques/georisques.types";
import { RgaService } from "../../adapters/georisques/rga/rga.service";
import { CatnatService } from "../../adapters/georisques/catnat/catnat.service";
import { TriZonageService } from "../../adapters/georisques/tri-zonage/tri-zonage.service";
import { TriService } from "../../adapters/georisques/tri/tri.service";
import { MvtService } from "../../adapters/georisques/mvt/mvt.service";
import { ZonageSismiqueService } from "../../adapters/georisques/zonage-sismique/zonage-sismique.service";
import { CavitesService } from "../../adapters/georisques/cavites/cavites.service";
import { OldService } from "../../adapters/georisques/old/old.service";
import { SisService } from "../../adapters/georisques/sis/sis.service";
import { IcpeService } from "../../adapters/georisques/icpe/icpe.service";
import { AziService } from "../../adapters/georisques/azi/azi.service";
import { PapiService } from "../../adapters/georisques/papi/papi.service";
import { GEORISQUES_RAYONS_DEFAUT } from "../../adapters/georisques/georisques.constants";
import { ResultatOrchestrationGeoRisques } from "./georisques.types";
import { PprService } from "../../adapters/georisques/ppr/ppr.service";

const PROMISE_FULFILLED = "fulfilled" as const;

/**
 * Orchestrateur du sous-domaine GeoRisques
 *
 * Responsabilités :
 * - Orchestrer les 13 appels GeoRisques en parallèle
 * - Construire le résultat structuré GeoRisquesResult
 * - Calculer la fiabilité GeoRisques
 * - Gérer les erreurs individuelles sans bloquer les autres appels
 */
@Injectable()
export class GeoRisquesOrchestrator {
  private readonly logger = new Logger(GeoRisquesOrchestrator.name);

  /**
   * Nombre total de services GeoRisques
   */
  private readonly TOTAL_SERVICES = 13;

  constructor(
    private readonly rgaService: RgaService,
    private readonly catnatService: CatnatService,
    private readonly triZonageService: TriZonageService,
    private readonly triService: TriService,
    private readonly mvtService: MvtService,
    private readonly zonageSismiqueService: ZonageSismiqueService,
    private readonly cavitesService: CavitesService,
    private readonly oldService: OldService,
    private readonly sisService: SisService,
    private readonly icpeService: IcpeService,
    private readonly aziService: AziService,
    private readonly papiService: PapiService,
    private readonly pprService: PprService,
  ) {}

  /**
   * Récupère toutes les données GeoRisques en parallèle
   *
   * @param coordonnees - Coordonnées géographiques
   * @returns Résultat complet de l'orchestration
   */
  async fetchAll(coordonnees: {
    latitude: number;
    longitude: number;
  }): Promise<ResultatOrchestrationGeoRisques> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];
    const result: GeoRisquesResult = {
      metadata: {
        sourcesUtilisees: [],
        sourcesEchouees: [],
        fiabilite: 0,
      },
    };

    // Lancer tous les appels en parallèle
    const [
      rgaResult,
      catnatResult,
      triZonageResult,
      triResult,
      mvtResult,
      zonageSismiqueResult,
      cavitesResult,
      oldResult,
      sisResult,
      icpeResult,
      aziResult,
      papiResult,
      pprResult,
    ] = await Promise.allSettled([
      this.rgaService.getRga({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
      }),
      this.catnatService.getCatnat({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
        rayon: GEORISQUES_RAYONS_DEFAUT.CATNAT,
      }),
      this.triZonageService.getTri({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
      }),
      this.triService.getTri({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
      }),
      this.mvtService.getMvt({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
        rayon: GEORISQUES_RAYONS_DEFAUT.MVT,
      }),
      this.zonageSismiqueService.getZonageSismique({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
      }),
      this.cavitesService.getCavites({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
        rayon: GEORISQUES_RAYONS_DEFAUT.CAVITES,
      }),
      this.oldService.getOld({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
      }),
      this.sisService.getSisByLatLon({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
        rayon: GEORISQUES_RAYONS_DEFAUT.SIS,
      }),
      this.icpeService.getIcpeByLatLon({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
        rayon: GEORISQUES_RAYONS_DEFAUT.ICPE,
      }),
      this.aziService.getAzi({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
        rayon: GEORISQUES_RAYONS_DEFAUT.AZI,
      }),
      this.papiService.getPapi({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
        rayon: GEORISQUES_RAYONS_DEFAUT.PAPI,
      }),
      this.pprService.getPpr({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
        rayon: GEORISQUES_RAYONS_DEFAUT.PPR,
      }),
    ]);

    // Traiter tous les résultats
    this.processGeoRisqueResult(
      rgaResult,
      "rga",
      "RGA",
      SourceEnrichissement.GEORISQUES_RGA,
      result,
      sourcesUtilisees,
      sourcesEchouees,
    );

    this.processGeoRisqueResult(
      catnatResult,
      "catnat",
      "CATNAT",
      SourceEnrichissement.GEORISQUES_CATNAT,
      result,
      sourcesUtilisees,
      sourcesEchouees,
    );

    this.processGeoRisqueResult(
      triZonageResult,
      "triZonage",
      "TRI Zonage",
      SourceEnrichissement.GEORISQUES_TRI_ZONAGE,
      result,
      sourcesUtilisees,
      sourcesEchouees,
    );

    this.processGeoRisqueResult(
      triResult,
      "tri",
      "TRI",
      SourceEnrichissement.GEORISQUES_TRI,
      result,
      sourcesUtilisees,
      sourcesEchouees,
    );

    this.processGeoRisqueResult(
      mvtResult,
      "mvt",
      "MVT",
      SourceEnrichissement.GEORISQUES_MVT,
      result,
      sourcesUtilisees,
      sourcesEchouees,
    );

    this.processGeoRisqueResult(
      zonageSismiqueResult,
      "zonageSismique",
      "Zonage Sismique",
      SourceEnrichissement.GEORISQUES_ZONAGE_SISMIQUE,
      result,
      sourcesUtilisees,
      sourcesEchouees,
    );

    this.processGeoRisqueResult(
      cavitesResult,
      "cavites",
      "Cavites",
      SourceEnrichissement.GEORISQUES_CAVITES,
      result,
      sourcesUtilisees,
      sourcesEchouees,
    );

    this.processGeoRisqueResult(
      oldResult,
      "old",
      "OLD",
      SourceEnrichissement.GEORISQUES_OLD,
      result,
      sourcesUtilisees,
      sourcesEchouees,
    );

    this.processGeoRisqueResult(
      sisResult,
      "sis",
      "SIS",
      SourceEnrichissement.GEORISQUES_SIS,
      result,
      sourcesUtilisees,
      sourcesEchouees,
    );

    this.processGeoRisqueResult(
      icpeResult,
      "icpe",
      "ICPE",
      SourceEnrichissement.GEORISQUES_ICPE,
      result,
      sourcesUtilisees,
      sourcesEchouees,
    );

    this.processGeoRisqueResult(
      aziResult,
      "azi",
      "AZI",
      SourceEnrichissement.GEORISQUES_AZI,
      result,
      sourcesUtilisees,
      sourcesEchouees,
    );

    this.processGeoRisqueResult(
      papiResult,
      "papi",
      "PAPI",
      SourceEnrichissement.GEORISQUES_PAPI,
      result,
      sourcesUtilisees,
      sourcesEchouees,
    );

    this.processGeoRisqueResult(
      pprResult,
      "ppr",
      "PPR",
      SourceEnrichissement.GEORISQUES_PPR,
      result,
      sourcesUtilisees,
      sourcesEchouees,
    );

    // Calculer la fiabilité GeoRisques (sur 10)
    const servicesReussis = sourcesUtilisees.length;
    result.metadata.sourcesUtilisees = sourcesUtilisees;
    result.metadata.sourcesEchouees = sourcesEchouees;
    result.metadata.fiabilite = (servicesReussis / this.TOTAL_SERVICES) * 10;

    this.logger.log(
      `GeoRisques orchestre: ${servicesReussis}/${this.TOTAL_SERVICES} services reussis ` +
        `(fiabilite: ${result.metadata.fiabilite.toFixed(1)}/10)`,
    );

    // Retourner undefined si aucun service n'a réussi
    if (servicesReussis === 0) {
      return {
        data: undefined,
        sourcesUtilisees,
        sourcesEchouees,
      };
    }

    return {
      data: result,
      sourcesUtilisees,
      sourcesEchouees,
    };
  }

  /**
   * Traite le résultat d'un service GeoRisques de manière générique
   */
  private processGeoRisqueResult(
    promiseResult: PromiseSettledResult<any>,
    resultKey: keyof Omit<GeoRisquesResult, "metadata">,
    serviceName: string,
    sourceEnrichissement: SourceEnrichissement,
    result: GeoRisquesResult,
    sourcesUtilisees: string[],
    sourcesEchouees: string[],
  ): void {
    if (promiseResult.status === PROMISE_FULFILLED) {
      const data = promiseResult.value;
      if (data.success && data.data) {
        result[resultKey] = data.data;
        sourcesUtilisees.push(sourceEnrichissement);
        this.logger.debug(`${serviceName}: succes`);
      } else {
        this.logger.warn(`${serviceName}: echec - ${data.error || "Aucune donnee"}`);
        sourcesEchouees.push(sourceEnrichissement);
      }
    } else {
      this.logger.error(
        `${serviceName}: erreur - ${promiseResult.reason}`,
        promiseResult.reason?.stack,
      );
      sourcesEchouees.push(sourceEnrichissement);
    }
  }
}
