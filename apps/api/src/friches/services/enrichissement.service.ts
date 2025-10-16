import { Injectable, Logger } from "@nestjs/common";
import { EnrichissementOutputDto, RisqueNaturel } from "@mutafriches/shared-types";
import { Parcelle } from "../domain/entities/parcelle.entity";
import { CadastreService } from "./external/cadastre/cadastre.service";
import { BdnbService } from "./external/bdnb/bdnb.service";
import { EnedisService } from "./external/enedis/enedis.service";
import { CadastreServiceResponse } from "./external/cadastre/cadastre.types";
import {
  StatutEnrichissement,
  CodeErreurEnrichissement,
  MessagesErreurEnrichissement,
  SourceEnrichissement,
} from "./enrichissement.constants";
import { LogsEnrichissementRepository } from "../repository/logs-enrichissement.repository";
import { RgaService } from "./external/georisques/rga/rga.service";
import { GeoRisquesResult } from "./external/georisques/georisques.types";
import { CatnatService } from "./external/georisques/catnat/catnat.service";
import { TriService } from "./external/georisques/tri/tri.service";
import { MvtService } from "./external/georisques/mvt/mvt.service";
import { ZonageSismiqueService } from "./external/georisques/zonage-sismique/zonage-sismique.service";

@Injectable()
export class EnrichissementService {
  private readonly logger = new Logger(EnrichissementService.name);

  constructor(
    private readonly cadastreService: CadastreService,
    private readonly bdnbService: BdnbService,
    private readonly enedisService: EnedisService,
    private readonly rgaService: RgaService,
    private readonly catnatService: CatnatService,
    private readonly triService: TriService,
    private readonly mvtService: MvtService,
    private readonly zonageSismiqueService: ZonageSismiqueService,

    private readonly logsRepository: LogsEnrichissementRepository,
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

      // 7. Risques naturels (BDNB)
      await this.enrichWithRisquesNaturels(
        parcelle,
        identifiantParcelle,
        sourcesUtilisees,
        champsManquants,
        sourcesEchouees,
      );

      // 8. Risques GeoRisques (RGA) ← NOUVEAU BLOC
      const risquesGeorisques = await this.enrichWithGeoRisques(
        parcelle.coordonnees,
        sourcesUtilisees,
        sourcesEchouees,
      );

      // 9. Données complémentaires temporaires
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

        // Risques GeoRisques
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
      this.logEnrichissement(
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
    this.logEnrichissement(
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
   * Helper pour l'enregistrement des logs d'enrichissement de manière non-bloquante
   */
  private logEnrichissement(
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
    this.logsRepository
      .log({
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
   * Enrichit avec les risques GeoRisques (RGA + CATNAT + TRI + MVT + Zonage Sismique)
   * Appels parallélisés pour optimiser les performances
   */
  private async enrichWithGeoRisques(
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
        SourceEnrichissement.GEORISQUES_MVT,
        SourceEnrichissement.GEORISQUES_ZONAGE_SISMIQUE,
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
    const [rgaResult, catnatResult, triResult, mvtResult, zonageSismiqueResult] =
      await Promise.allSettled([
        this.rgaService.getRga({
          latitude: coordonnees.latitude,
          longitude: coordonnees.longitude,
        }),
        this.catnatService.getCatnat({
          latitude: coordonnees.latitude,
          longitude: coordonnees.longitude,
          rayon: 1000,
        }),
        this.triService.getTri({
          latitude: coordonnees.latitude,
          longitude: coordonnees.longitude,
        }),
        this.mvtService.getMvt({
          latitude: coordonnees.latitude,
          longitude: coordonnees.longitude,
          rayon: 1000,
        }),
        this.zonageSismiqueService.getZonageSismique({
          latitude: coordonnees.latitude,
          longitude: coordonnees.longitude,
        }),
      ]);

    // 1. Traiter RGA
    if (rgaResult.status === "fulfilled") {
      const data = rgaResult.value;
      if (data.success && data.data) {
        result.rga = data.data;
        sourcesGeorisques.push(SourceEnrichissement.GEORISQUES_RGA);
        sources.push(SourceEnrichissement.GEORISQUES_RGA);
      } else {
        this.logger.warn(`Échec récupération RGA: ${data.error}`);
        echoueesGeorisques.push(SourceEnrichissement.GEORISQUES_RGA);
        echouees.push(SourceEnrichissement.GEORISQUES_RGA);
      }
    } else {
      this.logger.error(`Erreur GeoRisques RGA: ${rgaResult.reason}`, rgaResult.reason?.stack);
      echoueesGeorisques.push(SourceEnrichissement.GEORISQUES_RGA);
      echouees.push(SourceEnrichissement.GEORISQUES_RGA);
    }

    // 2. Traiter CATNAT
    if (catnatResult.status === "fulfilled") {
      const data = catnatResult.value;
      if (data.success && data.data) {
        result.catnat = data.data;
        sourcesGeorisques.push(SourceEnrichissement.GEORISQUES_CATNAT);
        sources.push(SourceEnrichissement.GEORISQUES_CATNAT);
      } else {
        this.logger.warn(`Échec récupération CATNAT: ${data.error}`);
        echoueesGeorisques.push(SourceEnrichissement.GEORISQUES_CATNAT);
        echouees.push(SourceEnrichissement.GEORISQUES_CATNAT);
      }
    } else {
      this.logger.error(
        `Erreur GeoRisques CATNAT: ${catnatResult.reason}`,
        catnatResult.reason?.stack,
      );
      echoueesGeorisques.push(SourceEnrichissement.GEORISQUES_CATNAT);
      echouees.push(SourceEnrichissement.GEORISQUES_CATNAT);
    }

    // 3. Traiter TRI
    if (triResult.status === "fulfilled") {
      const data = triResult.value;
      if (data.success && data.data) {
        result.triZonage = data.data;
        sourcesGeorisques.push(SourceEnrichissement.GEORISQUES_TRI);
        sources.push(SourceEnrichissement.GEORISQUES_TRI);
      } else {
        this.logger.warn(`Échec récupération TRI: ${data.error}`);
        echoueesGeorisques.push(SourceEnrichissement.GEORISQUES_TRI);
        echouees.push(SourceEnrichissement.GEORISQUES_TRI);
      }
    } else {
      this.logger.error(`Erreur GeoRisques TRI: ${triResult.reason}`, triResult.reason?.stack);
      echoueesGeorisques.push(SourceEnrichissement.GEORISQUES_TRI);
      echouees.push(SourceEnrichissement.GEORISQUES_TRI);
    }

    // 4. Traiter MVT
    if (mvtResult.status === "fulfilled") {
      const data = mvtResult.value;
      if (data.success && data.data) {
        result.mvt = data.data;
        sourcesGeorisques.push(SourceEnrichissement.GEORISQUES_MVT);
        sources.push(SourceEnrichissement.GEORISQUES_MVT);
      } else {
        this.logger.warn(`Échec récupération MVT: ${data.error}`);
        echoueesGeorisques.push(SourceEnrichissement.GEORISQUES_MVT);
        echouees.push(SourceEnrichissement.GEORISQUES_MVT);
      }
    } else {
      this.logger.error(`Erreur GeoRisques MVT: ${mvtResult.reason}`, mvtResult.reason?.stack);
      echoueesGeorisques.push(SourceEnrichissement.GEORISQUES_MVT);
      echouees.push(SourceEnrichissement.GEORISQUES_MVT);
    }

    // 5. Traiter Zonage Sismique
    if (zonageSismiqueResult.status === "fulfilled") {
      const data = zonageSismiqueResult.value;
      if (data.success && data.data) {
        result.zonageSismique = data.data;
        sourcesGeorisques.push(SourceEnrichissement.GEORISQUES_ZONAGE_SISMIQUE);
        sources.push(SourceEnrichissement.GEORISQUES_ZONAGE_SISMIQUE);
      } else {
        this.logger.warn(`Échec récupération Zonage Sismique: ${data.error}`);
        echoueesGeorisques.push(SourceEnrichissement.GEORISQUES_ZONAGE_SISMIQUE);
        echouees.push(SourceEnrichissement.GEORISQUES_ZONAGE_SISMIQUE);
      }
    } else {
      this.logger.error(
        `Erreur GeoRisques Zonage Sismique: ${zonageSismiqueResult.reason}`,
        zonageSismiqueResult.reason?.stack,
      );
      echoueesGeorisques.push(SourceEnrichissement.GEORISQUES_ZONAGE_SISMIQUE);
      echouees.push(SourceEnrichissement.GEORISQUES_ZONAGE_SISMIQUE);
    }

    // Calculer la fiabilité (sur 10)
    const totalServices = 5;
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
   * Enrichit avec les risques naturels depuis BDNB
   */
  private async enrichWithRisquesNaturels(
    parcelle: Parcelle,
    identifiantParcelle: string,
    sources: string[],
    manquants: string[],
    echouees: string[],
  ): Promise<void> {
    try {
      const risquesResult = await this.bdnbService.getRisquesNaturels(identifiantParcelle);

      if (risquesResult.success && risquesResult.data) {
        const risquesData = risquesResult.data;

        if (risquesData.aleaArgiles) {
          // Transformer l'aléa argiles BDNB en enum de présence de risques naturels
          parcelle.presenceRisquesNaturels = this.transformAleaArgilesToRisque(
            risquesData.aleaArgiles,
          );
          sources.push(SourceEnrichissement.BDNB_RISQUES);
        } else {
          manquants.push("presenceRisquesNaturels");
          echouees.push(SourceEnrichissement.BDNB_RISQUES);
        }
      } else {
        manquants.push("presenceRisquesNaturels");
        echouees.push(SourceEnrichissement.BDNB_RISQUES);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : MessagesErreurEnrichissement[CodeErreurEnrichissement.UNKNOWN_ERROR];
      this.logger.error("Erreur récupération risques naturels BDNB:", errorMessage);
      manquants.push("presenceRisquesNaturels");
      echouees.push(SourceEnrichissement.BDNB_RISQUES);
    }
  }

  /**
   * Transforme l'aléa argiles BDNB en risque naturel pour Mutafriches
   */
  private transformAleaArgilesToRisque(aleaArgiles: string): RisqueNaturel {
    const aleaNormalise = aleaArgiles.toLowerCase();

    if (aleaNormalise.includes("fort") || aleaNormalise.includes("élevé")) {
      return RisqueNaturel.FORT;
    } else if (aleaNormalise.includes("moyen") || aleaNormalise.includes("modéré")) {
      return RisqueNaturel.MOYEN;
    } else if (aleaNormalise.includes("faible") || aleaNormalise.includes("bas")) {
      return RisqueNaturel.FAIBLE;
    } else if (aleaNormalise.includes("nul") || aleaNormalise.includes("inexistant")) {
      return RisqueNaturel.AUCUN;
    }

    // Valeur par défaut si format non reconnu
    return RisqueNaturel.AUCUN;
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

      if (!parcelle.presenceRisquesTechnologiques) {
        parcelle.presenceRisquesTechnologiques = Math.random() > 0.8; // 20% de chance de risques technologiques
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
