import { Injectable, Logger } from "@nestjs/common";
import {
  CodeErreurEnrichissement,
  EnrichissementOutputDto,
  MessagesErreurEnrichissement,
  RisqueNaturel,
  SourceEnrichissement,
  StatutEnrichissement,
} from "@mutafriches/shared-types";
import { Parcelle } from "../domain/entities/parcelle.entity";
import { CadastreService } from "./external/cadastre/cadastre.service";
import { BdnbService } from "./external/bdnb/bdnb.service";
import { EnedisService } from "./external/enedis/enedis.service";
import { CadastreServiceResponse } from "./external/cadastre/cadastre.types";
import { EnrichissementRepository } from "../repository/enrichissement.repository";
import { RgaService } from "./external/georisques/rga/rga.service";
import { GeoRisquesResult } from "./external/georisques/georisques.types";
import { CatnatService } from "./external/georisques/catnat/catnat.service";
import { TriZonageService } from "./external/georisques/tri-zonage/tri-zonage.service";
import { MvtService } from "./external/georisques/mvt/mvt.service";
import { ZonageSismiqueService } from "./external/georisques/zonage-sismique/zonage-sismique.service";
import { CavitesService } from "./external/georisques/cavites/cavites.service";
import { GEORISQUES_RAYONS_DEFAUT } from "./external/georisques/georisques.constants";
import { OldService } from "./external/georisques/old/old.service";
import { SisService } from "./external/georisques/sis/sis.service";
import { IcpeService } from "./external/georisques/icpe/icpe.service";
import { CavitesResultNormalized } from "./external/georisques/cavites/cavites.types";
import { TriService } from "./external/georisques/tri/tri.service";
import { AziService } from "./external/georisques/azi/azi.service";

const PROMISE_FULFILLED = "fulfilled" as const;

@Injectable()
export class EnrichissementService {
  private readonly logger = new Logger(EnrichissementService.name);

  constructor(
    private readonly cadastreService: CadastreService,
    private readonly bdnbService: BdnbService,
    private readonly enedisService: EnedisService,
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

    private readonly enrichissementRepository: EnrichissementRepository,
  ) {}

  /**
   * Enrichit une parcelle depuis toutes les sources externes disponibles
   */
  async enrichir(
    identifiantParcelle: string,
    sourceUtilisation?: string,
    integrateur?: string,
  ): Promise<EnrichissementOutputDto> {
    const startTime = Date.now();
    const sourcesUtilisees: string[] = [];
    const champsManquants: string[] = [];
    const sourcesEchouees: string[] = [];

    let result: EnrichissementOutputDto;
    let statut = StatutEnrichissement.SUCCES;
    let messageErreur: string | undefined;
    let codeErreur: CodeErreurEnrichissement | undefined;

    try {
      // 1. Données cadastrales (obligatoires)
      const cadastreData = await this.getCadastreData(identifiantParcelle);
      if (!cadastreData) {
        throw new Error(
          MessagesErreurEnrichissement[CodeErreurEnrichissement.CADASTRE_INTROUVABLE],
        );
      }

      const parcelle = new Parcelle();
      parcelle.identifiantParcelle = cadastreData.identifiant;
      parcelle.codeInsee = cadastreData.codeInsee;
      parcelle.commune = cadastreData.commune;
      parcelle.surfaceSite = cadastreData.surface;
      parcelle.coordonnees = cadastreData.coordonnees;
      parcelle.geometrie = cadastreData.geometrie;
      sourcesUtilisees.push(SourceEnrichissement.CADASTRE);

      // 2. Surface bâtie (BDNB)
      const surfaceBatie = await this.getSurfaceBatie(identifiantParcelle);
      if (surfaceBatie !== null) {
        parcelle.surfaceBati = surfaceBatie;
        sourcesUtilisees.push(SourceEnrichissement.BDNB);
      } else {
        champsManquants.push("surfaceBati");
        sourcesEchouees.push(SourceEnrichissement.BDNB_SURFACE_BATIE);
      }

      // 3. Distance transport
      if (parcelle.coordonnees) {
        const distanceTransport = await this.getDistanceTransport(parcelle.coordonnees);
        if (distanceTransport !== null) {
          parcelle.distanceTransportCommun = distanceTransport;
          sourcesUtilisees.push(SourceEnrichissement.TRANSPORT);
        } else {
          champsManquants.push("distanceTransportCommun");
          sourcesEchouees.push(SourceEnrichissement.TRANSPORT);
        }

        // 4. Données Enedis
        await this.enrichWithEnedisData(
          parcelle,
          parcelle.coordonnees,
          sourcesUtilisees,
          champsManquants,
          sourcesEchouees,
        );

        // 5. Données Overpass
        await this.enrichWithOverpassData(
          parcelle,
          parcelle.coordonnees,
          sourcesUtilisees,
          champsManquants,
          sourcesEchouees,
        );
      }

      // 6. Données Lovac
      await this.enrichWithLovacData(
        parcelle,
        cadastreData.commune,
        sourcesUtilisees,
        champsManquants,
        sourcesEchouees,
      );

      // 7. Risques naturels (GeoRisques RGA + Cavités)
      await this.enrichRisquesNaturels(
        parcelle,
        parcelle.coordonnees,
        sourcesUtilisees,
        sourcesEchouees,
      );

      // 8 Risques technologiques (GeoRisques SIS + ICPE)
      await this.enrichRisquesTechnologiques(
        parcelle,
        parcelle.coordonnees,
        sourcesUtilisees,
        sourcesEchouees,
      );

      // 9. Risques GeoRisques Bruts
      const risquesGeorisques = await this.enrichWithRawGeoRisques(
        parcelle.coordonnees,
        sourcesUtilisees,
        sourcesEchouees,
      );

      // 10. Données complémentaires temporaires
      await this.enrichWithTemporaryMockData(
        parcelle,
        identifiantParcelle,
        sourcesUtilisees,
        champsManquants,
        sourcesEchouees,
      );

      const fiabilite = this.calculateFiabilite(sourcesUtilisees.length, champsManquants.length);

      // Déterminer le statut
      if (sourcesEchouees.length === 0) {
        statut = StatutEnrichissement.SUCCES;
      } else if (sourcesUtilisees.length > 0) {
        statut = StatutEnrichissement.PARTIEL;
      } else {
        statut = StatutEnrichissement.ECHEC;
      }

      result = {
        // Données déduites automatiquement de la parcelle
        identifiantParcelle: parcelle.identifiantParcelle,
        codeInsee: parcelle.codeInsee,
        commune: parcelle.commune,
        surfaceSite: parcelle.surfaceSite,
        surfaceBati: parcelle.surfaceBati,
        distanceRaccordementElectrique: parcelle.distanceRaccordementElectrique,
        presenceRisquesNaturels: parcelle.presenceRisquesNaturels,
        coordonnees: parcelle.coordonnees,
        geometrie: parcelle.geometrie,

        // Données non déductibles pour le moment
        siteEnCentreVille: parcelle.siteEnCentreVille,
        distanceAutoroute: parcelle.distanceAutoroute,
        distanceTransportCommun: parcelle.distanceTransportCommun,
        proximiteCommercesServices: parcelle.proximiteCommercesServices,
        tauxLogementsVacants: parcelle.tauxLogementsVacants,
        presenceRisquesTechnologiques: parcelle.presenceRisquesTechnologiques,
        zonageEnvironnemental: parcelle.zonageEnvironnemental,
        zonageReglementaire: parcelle.zonageReglementaire,
        zonagePatrimonial: parcelle.zonagePatrimonial,
        trameVerteEtBleue: parcelle.trameVerteEtBleue,

        // Risques GeoRisques Bruts
        risquesGeorisques,

        // Métadonnées d'enrichissement
        sourcesUtilisees,
        champsManquants,
        fiabilite,
      } as EnrichissementOutputDto;
    } catch (error) {
      statut = StatutEnrichissement.ECHEC;
      messageErreur =
        error instanceof Error
          ? error.message
          : MessagesErreurEnrichissement[CodeErreurEnrichissement.UNKNOWN_ERROR];
      codeErreur = CodeErreurEnrichissement.ENRICHISSEMENT_FAILED;

      this.logger.error("Erreur enrichissement:", messageErreur);

      // Logger l'échec de manière non-bloquante
      this.saveEnrichissement(
        identifiantParcelle,
        undefined,
        undefined,
        statut,
        undefined,
        messageErreur,
        codeErreur,
        sourcesUtilisees,
        sourcesEchouees,
        Date.now() - startTime,
        sourceUtilisation,
        integrateur,
      );

      // Relancer l'erreur pour le contrôleur
      throw error;
    }

    // Logger le succès ou partiel de manière non-bloquante
    this.saveEnrichissement(
      identifiantParcelle,
      result.codeInsee,
      result.commune,
      statut,
      result,
      messageErreur,
      codeErreur,
      sourcesUtilisees,
      sourcesEchouees,
      Date.now() - startTime,
      sourceUtilisation,
      integrateur,
    );

    return result;
  }

  /**
   * Helper pour l'enregistrement de l'enrichissement de manière non-bloquante
   */
  private saveEnrichissement(
    identifiantCadastral: string,
    codeInsee: string | undefined,
    commune: string | undefined,
    statut: StatutEnrichissement,
    donnees: EnrichissementOutputDto | undefined,
    messageErreur: string | undefined,
    codeErreur: CodeErreurEnrichissement | undefined,
    sourcesReussies: string[],
    sourcesEchouees: string[],
    dureeMs: number,
    sourceUtilisation: string | undefined,
    integrateur: string | undefined,
  ): void {
    // Appel non-bloquant - on ne veut pas que le log bloque l'enrichissement
    this.enrichissementRepository
      .save({
        identifiantCadastral,
        codeInsee,
        commune,
        statut,
        donnees,
        messageErreur,
        codeErreur,
        sourcesReussies,
        sourcesEchouees,
        dureeMs,
        sourceUtilisation,
        integrateur,
        versionApi: "1.0", // TODO : externaliser la version dans une config globale plus tard
      })
      .catch((error) => {
        // Ne pas bloquer si le log échoue, juste logger l'erreur
        this.logger.error("Erreur lors de l'enregistrement du log enrichissement:", error);
      });
  }

  /**
   * Récupère les données cadastrales
   */
  private async getCadastreData(identifiant: string): Promise<CadastreServiceResponse | null> {
    try {
      const result = await this.cadastreService.getParcelleInfo(identifiant);
      return result.success && result.data ? result.data : null;
    } catch (error) {
      this.logger.error("Erreur cadastre:", error);
      return null;
    }
  }

  /**
   * Récupère la surface bâtie depuis BDNB
   */
  private async getSurfaceBatie(identifiant: string): Promise<number | null> {
    try {
      const result = await this.bdnbService.getSurfaceBatie(identifiant);
      return result.success && result.data !== undefined ? result.data : null;
    } catch (error) {
      this.logger.error("Erreur BDNB:", error);
      return null;
    }
  }

  /**
   * Récupère la distance au transport en commun
   * TODO: Implémenter le service de transport manquant
   */
  private async getDistanceTransport(coordonnees: {
    latitude: number;
    longitude: number;
  }): Promise<number | null> {
    try {
      // TODO: Remplacer par le vrai service de transport
      this.logger.debug(
        `Transport temporaire pour coordonnées: ${coordonnees.latitude}, ${coordonnees.longitude}`,
      );

      // Données temporaires - distance aléatoire entre 100m et 2km
      const distanceTemporaire = Math.floor(Math.random() * 1900) + 100;
      return distanceTemporaire;
    } catch (error) {
      this.logger.error("Erreur Transport:", error);
      return null;
    }
  }

  /**
   * Enrichit avec les données Enedis
   */
  private async enrichWithEnedisData(
    parcelle: Parcelle,
    coordonnees: { latitude: number; longitude: number },
    sources: string[],
    manquants: string[],
    echouees: string[],
  ): Promise<void> {
    try {
      // Distance raccordement
      const distanceResult = await this.enedisService.getDistanceRaccordement(
        coordonnees.latitude,
        coordonnees.longitude,
      );

      if (distanceResult.success && distanceResult.data) {
        const raccordementData = distanceResult.data;
        parcelle.distanceRaccordementElectrique = raccordementData.distance;
        sources.push(SourceEnrichissement.ENEDIS_RACCORDEMENT);
      } else {
        manquants.push("distanceRaccordementElectrique");
        echouees.push(SourceEnrichissement.ENEDIS_RACCORDEMENT);
      }
    } catch (error) {
      this.logger.error("Erreur Enedis:", error);
      manquants.push("distanceRaccordementElectrique");
      echouees.push(SourceEnrichissement.ENEDIS_RACCORDEMENT);
    }
  }

  /**
   * Enrichit avec les risques GeoRisques (RGA + CATNAT + TRI + MVT + Zonage Sismique + Cavités + OLD)
   * Appels parallélisés pour optimiser les performances
   */
  private async enrichWithRawGeoRisques(
    coordonnees: { latitude: number; longitude: number } | undefined,
    sources: string[],
    echouees: string[],
  ): Promise<GeoRisquesResult | undefined> {
    if (!coordonnees) {
      this.logger.warn("Pas de coordonnées disponibles pour GeoRisques");
      echouees.push(
        SourceEnrichissement.GEORISQUES_RGA,
        SourceEnrichissement.GEORISQUES_CATNAT,
        SourceEnrichissement.GEORISQUES_TRI,
        SourceEnrichissement.GEORISQUES_TRI_ZONAGE,
        SourceEnrichissement.GEORISQUES_MVT,
        SourceEnrichissement.GEORISQUES_ZONAGE_SISMIQUE,
        SourceEnrichissement.GEORISQUES_CAVITES,
        SourceEnrichissement.GEORISQUES_OLD,
        SourceEnrichissement.GEORISQUES_SIS,
        SourceEnrichissement.GEORISQUES_ICPE,
        SourceEnrichissement.GEORISQUES_AZI,
      );
      return undefined;
    }

    const sourcesGeorisques: string[] = [];
    const echoueesGeorisques: string[] = [];
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
    ]);

    // Traiter tous les résultats avec une méthode générique
    // 1. RGA
    this.processGeoRisqueResult(
      rgaResult,
      "rga",
      "RGA",
      SourceEnrichissement.GEORISQUES_RGA,
      result,
      sources,
      echouees,
      sourcesGeorisques,
      echoueesGeorisques,
    );

    // 2. CATNAT
    this.processGeoRisqueResult(
      catnatResult,
      "catnat",
      "CATNAT",
      SourceEnrichissement.GEORISQUES_CATNAT,
      result,
      sources,
      echouees,
      sourcesGeorisques,
      echoueesGeorisques,
    );

    // 3. TRI Zonage
    this.processGeoRisqueResult(
      triZonageResult,
      "triZonage",
      "TRI Zonage",
      SourceEnrichissement.GEORISQUES_TRI_ZONAGE,
      result,
      sources,
      echouees,
      sourcesGeorisques,
      echoueesGeorisques,
    );

    // 4. TRI
    this.processGeoRisqueResult(
      triResult,
      "tri",
      "TRI",
      SourceEnrichissement.GEORISQUES_TRI,
      result,
      sources,
      echouees,
      sourcesGeorisques,
      echoueesGeorisques,
    );

    // 5. MVT
    this.processGeoRisqueResult(
      mvtResult,
      "mvt",
      "MVT",
      SourceEnrichissement.GEORISQUES_MVT,
      result,
      sources,
      echouees,
      sourcesGeorisques,
      echoueesGeorisques,
    );

    // 6. Zonage Sismique
    this.processGeoRisqueResult(
      zonageSismiqueResult,
      "zonageSismique",
      "Zonage Sismique",
      SourceEnrichissement.GEORISQUES_ZONAGE_SISMIQUE,
      result,
      sources,
      echouees,
      sourcesGeorisques,
      echoueesGeorisques,
    );

    // 7. Cavités
    this.processGeoRisqueResult(
      cavitesResult,
      "cavites",
      "Cavités",
      SourceEnrichissement.GEORISQUES_CAVITES,
      result,
      sources,
      echouees,
      sourcesGeorisques,
      echoueesGeorisques,
    );

    // 8. OLD
    this.processGeoRisqueResult(
      oldResult,
      "old",
      "OLD",
      SourceEnrichissement.GEORISQUES_OLD,
      result,
      sources,
      echouees,
      sourcesGeorisques,
      echoueesGeorisques,
    );

    // 9. SIS
    this.processGeoRisqueResult(
      sisResult,
      "sis",
      "SIS",
      SourceEnrichissement.GEORISQUES_SIS,
      result,
      sources,
      echouees,
      sourcesGeorisques,
      echoueesGeorisques,
    );

    // 10. ICPE
    this.processGeoRisqueResult(
      icpeResult,
      "icpe",
      "ICPE",
      SourceEnrichissement.GEORISQUES_ICPE,
      result,
      sources,
      echouees,
      sourcesGeorisques,
      echoueesGeorisques,
    );

    // 11. AZI
    this.processGeoRisqueResult(
      aziResult,
      "azi",
      "AZI",
      SourceEnrichissement.GEORISQUES_AZI,
      result,
      sources,
      echouees,
      sourcesGeorisques,
      echoueesGeorisques,
    );

    // Calculer la fiabilité (sur 10)
    const totalServices = 11; // Nombre total de services GeoRisques appelés
    const servicesReussis = sourcesGeorisques.length;
    result.metadata.sourcesUtilisees = sourcesGeorisques;
    result.metadata.sourcesEchouees = echoueesGeorisques;
    result.metadata.fiabilite = (servicesReussis / totalServices) * 10;

    // Retourner undefined si aucun service n'a réussi
    if (servicesReussis === 0) {
      return undefined;
    }

    return result;
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
    sources: string[],
    echouees: string[],
    sourcesGeorisques: string[],
    echoueesGeorisques: string[],
  ): void {
    if (promiseResult.status === PROMISE_FULFILLED) {
      const data = promiseResult.value;
      if (data.success && data.data) {
        result[resultKey] = data.data;
        sourcesGeorisques.push(sourceEnrichissement);
        sources.push(sourceEnrichissement);
      } else {
        this.logger.warn(`Échec récupération ${serviceName}: ${data.error}`);
        echoueesGeorisques.push(sourceEnrichissement);
        echouees.push(sourceEnrichissement);
      }
    } else {
      this.logger.error(
        `Erreur GeoRisques ${serviceName}: ${promiseResult.reason}`,
        promiseResult.reason?.stack,
      );
      echoueesGeorisques.push(sourceEnrichissement);
      echouees.push(sourceEnrichissement);
    }
  }

  /**
   * Enrichit les risques naturels depuis l'API Géorisques
   * Calcule le niveau de risque en fonction du RGA
   * et de la présence de cavités souterraines
   */
  private async enrichRisquesNaturels(
    parcelle: Parcelle,
    coordonnees: { latitude: number; longitude: number } | undefined,
    sources: string[],
    echouees: string[],
  ): Promise<void> {
    if (!coordonnees) {
      this.logger.warn("Pas de coordonnées disponibles pour les risques naturels");
      echouees.push(SourceEnrichissement.GEORISQUES_RGA, SourceEnrichissement.GEORISQUES_CAVITES);
      return;
    }

    let aleaRga: RisqueNaturel = RisqueNaturel.AUCUN;
    let aleaCavites: RisqueNaturel = RisqueNaturel.AUCUN;
    let rgaSuccess = false;
    let cavitesSuccess = false;

    // 1. Récupérer l'aléa RGA
    try {
      const rgaResult = await this.rgaService.getRga({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
      });

      if (rgaResult.success && rgaResult.data) {
        aleaRga = this.transformRgaToRisque(rgaResult.data.alea);
        rgaSuccess = true;
        this.logger.debug(`RGA récupéré: ${rgaResult.data.alea} → ${aleaRga}`);
      } else {
        this.logger.warn(`Échec récupération RGA: ${rgaResult.error}`);
        echouees.push(SourceEnrichissement.GEORISQUES_RGA);
      }
    } catch (error) {
      this.logger.error("Erreur RGA:", error);
      echouees.push(SourceEnrichissement.GEORISQUES_RGA);
    }

    // 2. Récupérer l'aléa Cavités
    try {
      const cavitesResult = await this.cavitesService.getCavites({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
        rayon: GEORISQUES_RAYONS_DEFAUT.CAVITES,
      });

      if (cavitesResult.success && cavitesResult.data) {
        aleaCavites = this.transformCavitesToRisque(cavitesResult.data);
        cavitesSuccess = true;
        this.logger.debug(
          `Cavités récupérées: ${cavitesResult.data.nombreCavites} cavités, ` +
            `plus proche: ${cavitesResult.data.distancePlusProche ? `${Math.round(cavitesResult.data.distancePlusProche)}m` : "N/A"} → ${aleaCavites}`,
        );
      } else {
        this.logger.warn(`Échec récupération Cavités: ${cavitesResult.error}`);
        echouees.push(SourceEnrichissement.GEORISQUES_CAVITES);
      }
    } catch (error) {
      this.logger.error("Erreur Cavités:", error);
      echouees.push(SourceEnrichissement.GEORISQUES_CAVITES);
    }

    // 3. Calculer le risque naturel final selon les règles de combinaison
    const risqueFinal = this.combinerRisquesNaturels(aleaRga, aleaCavites);
    parcelle.presenceRisquesNaturels = risqueFinal;

    // 4. Ajout des sources réussies
    if (rgaSuccess) {
      sources.push(SourceEnrichissement.GEORISQUES_RGA);
    }

    if (cavitesSuccess) {
      sources.push(SourceEnrichissement.GEORISQUES_CAVITES);
    }

    this.logger.log(
      `Risques naturels calculés: RGA=${aleaRga}, Cavités=${aleaCavites} → Final=${risqueFinal}`,
    );
  }

  /**
   * Combine les risques RGA et Cavités selon les règles métier
   *
   * Règles:
   * - Si un des deux est FORT et l'autre est FORT ou MOYEN → FORT
   * - Si un des deux est FORT et l'autre est FAIBLE ou AUCUN → MOYEN
   * - Si au moins un est MOYEN → MOYEN
   * - Si les deux sont FAIBLE ou (un FAIBLE + un AUCUN) → FAIBLE
   * - Sinon → AUCUN
   */
  private combinerRisquesNaturels(
    aleaRga: RisqueNaturel,
    aleaCavites: RisqueNaturel,
  ): RisqueNaturel {
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

    // Si un des deux est FORT
    if (niveauMax === 3) {
      // FORT + FORT ou FORT + MOYEN → FORT
      if (niveauMin >= 2) {
        return RisqueNaturel.FORT;
      }
      // FORT + FAIBLE ou FORT + AUCUN → MOYEN
      return RisqueNaturel.MOYEN;
    }

    // Si au moins un est MOYEN → MOYEN
    if (niveauMax === 2) {
      return RisqueNaturel.MOYEN;
    }

    // Si au moins un est FAIBLE → FAIBLE
    if (niveauMax === 1) {
      return RisqueNaturel.FAIBLE;
    }

    // Les deux sont AUCUN → AUCUN
    return RisqueNaturel.AUCUN;
  }

  /**
   * Transforme le niveau d'aléa RGA en risque naturel
   */
  private transformRgaToRisque(alea: string): RisqueNaturel {
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
   */
  private transformCavitesToRisque(cavitesData: CavitesResultNormalized): RisqueNaturel {
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
      // Cavité superieure à 1000m
      return RisqueNaturel.FAIBLE;
    }
  }

  /**
   * Enrichit les risques technologiques depuis l'API Géorisques
   * Calcule le niveau de risque en fonction de la présence SIS et ICPE
   */
  private async enrichRisquesTechnologiques(
    parcelle: Parcelle,
    coordonnees: { latitude: number; longitude: number } | undefined,
    sources: string[],
    echouees: string[],
  ): Promise<void> {
    if (!coordonnees) {
      this.logger.warn("Pas de coordonnées disponibles pour les risques technologiques");
      echouees.push(SourceEnrichissement.GEORISQUES_ICPE, SourceEnrichissement.GEORISQUES_SIS);
      return;
    }

    let presenceSis = false;
    let distanceIcpePlusProche: number | undefined;

    let sisSuccess = false;
    let icpeSuccess = false;

    // 1. Récupérer la présence SIS
    try {
      const sisResult = await this.sisService.getSisByLatLon({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
        rayon: GEORISQUES_RAYONS_DEFAUT.SIS,
      });

      if (sisResult.success && sisResult.data) {
        presenceSis = sisResult.data.presenceSis;
        sisSuccess = true;
        this.logger.debug(`SIS récupéré: présence=${presenceSis}`);
      } else {
        this.logger.warn(`Échec récupération SIS: ${sisResult.error}`);
        echouees.push(SourceEnrichissement.GEORISQUES_SIS);
      }
    } catch (error) {
      this.logger.error("Erreur SIS:", error);
      echouees.push(SourceEnrichissement.GEORISQUES_SIS);
    }

    // 2. Récupérer l'ICPE la plus proche
    try {
      const icpeResult = await this.icpeService.getIcpeByLatLon({
        latitude: coordonnees.latitude,
        longitude: coordonnees.longitude,
        rayon: GEORISQUES_RAYONS_DEFAUT.ICPE,
      });

      if (icpeResult.success && icpeResult.data) {
        distanceIcpePlusProche = icpeResult.data.distancePlusProche;
        icpeSuccess = true;
        this.logger.debug(
          `ICPE récupérées: ${icpeResult.data.nombreIcpe} installations, ` +
            `plus proche: ${distanceIcpePlusProche !== undefined ? `${Math.round(distanceIcpePlusProche)}m` : "N/A"}`,
        );
      } else {
        this.logger.warn(`Échec récupération ICPE: ${icpeResult.error}`);
        echouees.push(SourceEnrichissement.GEORISQUES_ICPE);
      }
    } catch (error) {
      this.logger.error("Erreur ICPE:", error);
      echouees.push(SourceEnrichissement.GEORISQUES_ICPE);
    }

    // 3. Calculer le risque technologique final selon les règles de combinaison
    // Règles:
    // - Si présence SIS → OUI
    // - Si ICPE plus proche <= 500m → OUI
    // - Sinon → NON
    const risqueIcpe = distanceIcpePlusProche !== undefined && distanceIcpePlusProche <= 500;
    const risqueFinal = presenceSis || risqueIcpe;

    parcelle.presenceRisquesTechnologiques = risqueFinal;

    // 4. Ajout des sources réussies
    if (sisSuccess) {
      sources.push(SourceEnrichissement.GEORISQUES_SIS);
    }

    if (icpeSuccess) {
      sources.push(SourceEnrichissement.GEORISQUES_ICPE);
    }

    this.logger.log(
      `Risques technologiques calculés: SIS=${presenceSis}, ICPE=${distanceIcpePlusProche !== undefined ? `${Math.round(distanceIcpePlusProche)}m` : "N/A"} → Final=${risqueFinal}`,
    );
  }

  /**
   * Enrichit avec les données Overpass
   * TODO: Implémenter les services Overpass pour commerces/services à proximité
   */
  private async enrichWithOverpassData(
    parcelle: Parcelle,
    coordonnees: { latitude: number; longitude: number },
    sources: string[],
    manquants: string[],
    echouees: string[],
  ): Promise<void> {
    try {
      // TODO: Implémenter les appels aux services Overpass pour récupérer les données
      this.logger.debug(
        `Overpass temporaire pour coordonnées: ${coordonnees.latitude}, ${coordonnees.longitude}`,
      );

      // Données temporaires - présence aléatoire de commerces/services
      const hasCommercesServices = Math.random() > 0.5;
      parcelle.proximiteCommercesServices = hasCommercesServices;
      sources.push(SourceEnrichissement.OVERPASS_TEMPORAIRE);
    } catch (error) {
      this.logger.error("Erreur Overpass:", error);
      manquants.push("proximiteCommercesServices");
      echouees.push(SourceEnrichissement.OVERPASS);
    }
  }

  /**
   * Enrichit avec les données Lovac
   * TODO: Implémenter le service Lovac pour les taux de logements vacants
   */
  private async enrichWithLovacData(
    parcelle: Parcelle,
    commune: string,
    sources: string[],
    manquants: string[],
    echouees: string[],
  ): Promise<void> {
    try {
      // TODO: Implémenter l'appel au service Lovac pour récupérer les données
      this.logger.debug(`Lovac temporaire pour commune: ${commune}`);

      // Données temporaires - taux de logements vacants aléatoire entre 2% et 15%
      const tauxTemporaire = Math.floor(Math.random() * 13) + 2;
      parcelle.tauxLogementsVacants = tauxTemporaire;
      sources.push(SourceEnrichissement.LOVAC_TEMPORAIRE);
    } catch (error) {
      this.logger.error("Erreur Lovac:", error);
      manquants.push("tauxLogementsVacants");
      echouees.push(SourceEnrichissement.LOVAC);
    }
  }

  /**
   * Enrichit avec les données temporaires restantes
   * TODO: Remplacer par de vrais services quand disponibles
   */
  private async enrichWithTemporaryMockData(
    parcelle: Parcelle,
    identifiant: string,
    sources: string[],
    manquants: string[],
    echouees: string[],
  ): Promise<void> {
    // TODO: Ces champs seront enrichis par de vrais services plus tard
    this.logger.debug(`Données temporaires pour parcelle: ${identifiant}`);

    try {
      // Données temporaires pour les champs manquants
      if (!parcelle.siteEnCentreVille) {
        parcelle.siteEnCentreVille = Math.random() > 0.6; // 40% de chance d'être en centre-ville
      }

      if (!parcelle.distanceAutoroute) {
        parcelle.distanceAutoroute = Math.floor(Math.random() * 20) + 1; // Entre 1 et 20 km
      }

      sources.push(SourceEnrichissement.DONNEES_TEMPORAIRES);
    } catch (error) {
      this.logger.error("Erreur données temporaires:", error);
      manquants.push("données-temporaires");
      echouees.push(SourceEnrichissement.DONNEES_TEMPORAIRES);
    }
  }

  /**
   * Calcule l'indice de fiabilité
   */
  private calculateFiabilite(sourcesCount: number, manquantsCount: number): number {
    let fiabilite = 10;
    fiabilite -= manquantsCount * 0.3;
    fiabilite -= sourcesCount > 2 ? 0 : 2; // Bonus si plusieurs sources
    return Math.max(0, Math.min(10, Math.round(fiabilite * 10) / 10));
  }
}
