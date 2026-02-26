import { Injectable, Logger } from "@nestjs/common";
import {
  CodeErreurEnrichissement,
  EnrichissementOutputDto,
  GeometrieParcelle,
  MessagesErreurEnrichissement,
  StatutEnrichissement,
} from "@mutafriches/shared-types";
import { EnrichissementRepository } from "../repositories/enrichissement.repository";
import { SiteRepository } from "../repositories/site.repository";
import { Site as SiteEvaluation } from "../../evaluation/entities/site.entity";
import { Site } from "../entities/site.entity";
import { CadastreEnrichissementService } from "./cadastre/cadastre-enrichissement.service";
import { EnergieEnrichissementService } from "./energie/energie-enrichissement.service";
import { TransportEnrichissementService } from "./transport/transport-enrichissement.service";
import { UrbanismeEnrichissementService } from "./urbanisme/urbanisme-enrichissement.service";
import { RisquesNaturelsEnrichissementService } from "./risques-naturels/risques-naturels-enrichissement.service";
import { RisquesTechnologiquesEnrichissementService } from "./risques-technologiques/risques-technologiques-enrichissement.service";
import { GeoRisquesEnrichissementService } from "./georisques/georisques-enrichissement.service";
import { ZonageOrchestratorService } from "./zonage";
import { PollutionDetectionService } from "./pollution/pollution-detection.service";

/**
 * Service principal d'enrichissement - Orchestrateur
 *
 * Responsabilités :
 * - Orchestrer l'enrichissement via tous les sous-domaines
 * - Gérer les erreurs globales
 * - Persister les résultats
 * - Construire le DTO de sortie
 *
 * Délègue toute la logique métier aux sous-domaines spécialisés
 */
@Injectable()
export class EnrichissementService {
  private readonly logger = new Logger(EnrichissementService.name);

  constructor(
    // Sous-domaines d'enrichissement
    private readonly cadastreEnrichissement: CadastreEnrichissementService,
    private readonly energieEnrichissement: EnergieEnrichissementService,
    private readonly transportEnrichissement: TransportEnrichissementService,
    private readonly urbanismeEnrichissement: UrbanismeEnrichissementService,
    private readonly risquesNaturelsEnrichissement: RisquesNaturelsEnrichissementService,
    private readonly risquesTechnologiquesEnrichissement: RisquesTechnologiquesEnrichissementService,
    private readonly georisquesEnrichissement: GeoRisquesEnrichissementService,
    private readonly zonageOrchestrator: ZonageOrchestratorService,
    private readonly pollutionDetection: PollutionDetectionService,

    // Utilitaires
    private readonly enrichissementRepository: EnrichissementRepository,
    private readonly siteRepository: SiteRepository,
  ) {}

  /**
   * Enrichit un site (mono-parcelle) depuis toutes les sources externes disponibles
   *
   * @param identifiantParcelle - Identifiant cadastral
   * @param sourceUtilisation - Source de l'utilisation (optionnel)
   * @param integrateur - Nom de l'intégrateur (optionnel)
   * @returns DTO d'enrichissement complet
   */
  async enrichir(
    identifiantParcelle: string,
    sourceUtilisation?: string,
    integrateur?: string,
  ): Promise<EnrichissementOutputDto> {
    const startTime = Date.now();

    // 0. VERIFIER LE CACHE
    const cached = await this.enrichissementRepository.findValidCache(identifiantParcelle);
    if (cached) {
      this.logger.log(`Cache enrichissement hit pour ${identifiantParcelle}, source: ${cached.id}`);

      // Enregistrer l'utilisation du cache pour analytics (non-bloquant)
      this.saveCachedEnrichissement(
        identifiantParcelle,
        cached.donnees,
        cached.id,
        Date.now() - startTime,
        sourceUtilisation,
        integrateur,
      );

      return cached.donnees;
    }

    this.logger.log(
      `Cache enrichissement miss pour ${identifiantParcelle}, enrichissement complet`,
    );

    const sourcesUtilisees: string[] = [];
    const champsManquants: string[] = [];
    const sourcesEchouees: string[] = [];

    let result: EnrichissementOutputDto;
    let statut = StatutEnrichissement.SUCCES;
    let messageErreur: string | undefined;
    let codeErreur: CodeErreurEnrichissement | undefined;

    try {
      // 1. CADASTRE + BDNB (obligatoire - initialise les données du site)
      this.logger.log(`Debut enrichissement: ${identifiantParcelle}`);
      const cadastreResult = await this.cadastreEnrichissement.enrichir(identifiantParcelle);

      if (!cadastreResult.site) {
        throw new Error(
          MessagesErreurEnrichissement[CodeErreurEnrichissement.CADASTRE_INTROUVABLE],
        );
      }

      const siteEval = cadastreResult.site;
      this.mergeEnrichmentResult(
        cadastreResult.result,
        sourcesUtilisees,
        champsManquants,
        sourcesEchouees,
      );

      // 2. ENERGIE (distance raccordement électrique)
      const energieResult = await this.energieEnrichissement.enrichir(siteEval);
      this.mergeEnrichmentResult(energieResult, sourcesUtilisees, champsManquants, sourcesEchouees);

      // 3. TRANSPORT (distance transport en commun)
      const transportResult = await this.transportEnrichissement.enrichir(siteEval);
      this.mergeEnrichmentResult(
        transportResult,
        sourcesUtilisees,
        champsManquants,
        sourcesEchouees,
      );

      // 4. URBANISME (commerces, logements vacants, centre-ville)
      const urbanismeResult = await this.urbanismeEnrichissement.enrichir(siteEval);
      this.mergeEnrichmentResult(
        urbanismeResult,
        sourcesUtilisees,
        champsManquants,
        sourcesEchouees,
      );

      // 5. RISQUES NATURELS (RGA + Cavités)
      const risquesNaturelsResult = await this.risquesNaturelsEnrichissement.enrichir(siteEval);
      this.mergeEnrichmentResult(
        risquesNaturelsResult.result,
        sourcesUtilisees,
        champsManquants,
        sourcesEchouees,
      );

      // 6. RISQUES TECHNOLOGIQUES (SIS + ICPE)
      const risquesTechnologiquesResult =
        await this.risquesTechnologiquesEnrichissement.enrichir(siteEval);
      this.mergeEnrichmentResult(
        risquesTechnologiquesResult.result,
        sourcesUtilisees,
        champsManquants,
        sourcesEchouees,
      );

      // 7. GEORISQUES RAW (13 APIs pour intégrateurs)
      let risquesGeorisques;
      if (siteEval.coordonnees) {
        const georisquesResult = await this.georisquesEnrichissement.enrichir(siteEval.coordonnees);
        this.mergeEnrichmentResult(
          georisquesResult.result,
          sourcesUtilisees,
          champsManquants,
          sourcesEchouees,
        );
        risquesGeorisques = georisquesResult.data;
      }

      // 8. ZONAGES (Environnemental, Patrimonial, Réglementaire)
      let zonagesResult;
      if (siteEval.geometrie && siteEval.codeInsee) {
        zonagesResult = await this.zonageOrchestrator.enrichirZonages(
          siteEval.geometrie,
          siteEval.codeInsee,
        );
        this.mergeEnrichmentResult(
          zonagesResult.result,
          sourcesUtilisees,
          champsManquants,
          sourcesEchouees,
        );

        // Affecter les zonages au site
        siteEval.zonageEnvironnemental = zonagesResult.zonageEnvironnemental;
        siteEval.zonagePatrimonial = zonagesResult.zonagePatrimonial;
        siteEval.zonageReglementaire = zonagesResult.zonageReglementaire;
      }

      // 9. POLLUTION (ADEME + SIS + ICPE)
      let siteReferencePollue = false;
      if (siteEval.coordonnees) {
        const pollutionResult = await this.pollutionDetection.detecterPollution(
          siteEval.coordonnees.latitude,
          siteEval.coordonnees.longitude,
          siteEval.codeInsee,
        );
        siteReferencePollue = pollutionResult.siteReferencePollue;
        sourcesUtilisees.push(...pollutionResult.sourcesUtilisees);
        sourcesEchouees.push(...pollutionResult.sourcesEchouees);
      }

      // 10. CALCULER LA FIABILITE
      const sourcesUniques = [...new Set(sourcesUtilisees)];
      const champsManquantsUniques = [...new Set(champsManquants)];

      this.logger.debug(`Sources uniques (${sourcesUniques.length}): ${sourcesUniques.join(", ")}`);
      this.logger.debug(
        `Champs manquants uniques (${champsManquantsUniques.length}): ${champsManquantsUniques.join(", ")}`,
      );

      // 10. DÉTERMINER LE STATUT
      if (sourcesEchouees.length === 0) {
        statut = StatutEnrichissement.SUCCES;
      } else if (sourcesUtilisees.length > 0) {
        statut = StatutEnrichissement.PARTIEL;
      } else {
        statut = StatutEnrichissement.ECHEC;
      }

      // 11. CONSTRUIRE LE DTO DE SORTIE
      result = {
        // Données déduites automatiquement du site
        identifiantParcelle: siteEval.identifiantParcelle,
        codeInsee: siteEval.codeInsee,
        commune: siteEval.commune,
        surfaceSite: siteEval.surfaceSite,
        surfaceBati: siteEval.surfaceBati,
        distanceRaccordementElectrique: siteEval.distanceRaccordementElectrique,
        presenceRisquesNaturels: siteEval.presenceRisquesNaturels,
        coordonnees: siteEval.coordonnees,
        geometrie: siteEval.geometrie,

        // Données non déductibles pour le moment
        siteEnCentreVille: siteEval.siteEnCentreVille,
        distanceAutoroute: siteEval.distanceAutoroute,
        distanceTransportCommun: siteEval.distanceTransportCommun,
        proximiteCommercesServices: siteEval.proximiteCommercesServices,
        tauxLogementsVacants: siteEval.tauxLogementsVacants,
        presenceRisquesTechnologiques: siteEval.presenceRisquesTechnologiques,
        siteReferencePollue,
        zonageEnvironnemental: siteEval.zonageEnvironnemental,
        zonageReglementaire: siteEval.zonageReglementaire,
        zonagePatrimonial: siteEval.zonagePatrimonial,
        trameVerteEtBleue: siteEval.trameVerteEtBleue,

        // Risques GeoRisques Bruts
        risquesGeorisques,

        // TODO: supprimer apres analyse - Diagnostic zonages (dev/staging)
        diagnosticZonages: zonagesResult?.diagnosticZonages,

        // Métadonnées d'enrichissement
        sourcesUtilisees: sourcesUniques,
        champsManquants: champsManquantsUniques,
        sourcesEchouees: [...new Set(sourcesEchouees)],
      } as EnrichissementOutputDto;

      this.logger.log(`Enrichissement termine: ${identifiantParcelle} (statut: ${statut}`);
    } catch (error) {
      statut = StatutEnrichissement.ECHEC;
      messageErreur =
        error instanceof Error
          ? error.message
          : MessagesErreurEnrichissement[CodeErreurEnrichissement.UNKNOWN_ERROR];
      codeErreur = CodeErreurEnrichissement.ENRICHISSEMENT_FAILED;

      this.logger.error(`Erreur enrichissement ${identifiantParcelle}:`, messageErreur);

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
   * Enrichit un site multi-parcellaire depuis toutes les sources externes
   *
   * Stratégie "Parcelle virtuelle" : construit une Parcelle à partir du Site
   * pour réutiliser les sous-services existants sans modification.
   *
   * Exceptions :
   * - Risques naturels : utilise les coordonnées de la parcelle prédominante
   * - Zonages : utilise géométrie union (env/patri) et prédominante (réglementaire)
   */
  async enrichirSite(
    identifiants: string[],
    sourceUtilisation?: string,
    integrateur?: string,
  ): Promise<EnrichissementOutputDto> {
    const startTime = Date.now();

    // 0. VÉRIFIER LE CACHE SITE
    const cached = await this.siteRepository.findValidCache(identifiants);
    if (cached) {
      this.logger.log(`Cache site hit pour [${identifiants.join(",")}], source: ${cached.id}`);

      this.saveCachedSite(
        identifiants,
        cached.donnees,
        cached.id,
        Date.now() - startTime,
        sourceUtilisation,
        integrateur,
      );

      return cached.donnees;
    }

    this.logger.log(`Cache site miss pour [${identifiants.join(",")}], enrichissement complet`);

    const sourcesUtilisees: string[] = [];
    const champsManquants: string[] = [];
    const sourcesEchouees: string[] = [];

    let result: EnrichissementOutputDto;
    let statut = StatutEnrichissement.SUCCES;
    let messageErreur: string | undefined;
    let codeErreur: CodeErreurEnrichissement | undefined;

    try {
      // 1. CADASTRE MULTI-PARCELLAIRE (obligatoire - initialise le site)
      this.logger.log(`Début enrichissement site : ${identifiants.length} parcelle(s)`);
      const cadastreResult = await this.cadastreEnrichissement.enrichirMulti(identifiants);

      if (!cadastreResult.site) {
        throw new Error(
          MessagesErreurEnrichissement[CodeErreurEnrichissement.CADASTRE_INTROUVABLE],
        );
      }

      const site = cadastreResult.site;
      this.mergeEnrichmentResult(
        cadastreResult.result,
        sourcesUtilisees,
        champsManquants,
        sourcesEchouees,
      );

      // 2. CONSTRUIRE LE SITE D'ÉVALUATION à partir du site
      const siteEval = this.buildVirtualSiteEval(site);

      // 3. ÉNERGIE (distance raccordement électrique) -> centroïde du site
      const energieResult = await this.energieEnrichissement.enrichir(siteEval);
      this.mergeEnrichmentResult(energieResult, sourcesUtilisees, champsManquants, sourcesEchouees);

      // 4. TRANSPORT -> centroïde du site
      const transportResult = await this.transportEnrichissement.enrichir(siteEval);
      this.mergeEnrichmentResult(
        transportResult,
        sourcesUtilisees,
        champsManquants,
        sourcesEchouees,
      );

      // 5. URBANISME -> LOVAC: commune prédominante, BPE: centroïde
      const urbanismeResult = await this.urbanismeEnrichissement.enrichir(siteEval);
      this.mergeEnrichmentResult(
        urbanismeResult,
        sourcesUtilisees,
        champsManquants,
        sourcesEchouees,
      );

      // 6. RISQUES NATURELS -> coordonnées de la parcelle prédominante
      const siteEvalRisquesNaturels = this.buildSiteEvalPredominante(site);
      const risquesNaturelsResult =
        await this.risquesNaturelsEnrichissement.enrichir(siteEvalRisquesNaturels);
      this.mergeEnrichmentResult(
        risquesNaturelsResult.result,
        sourcesUtilisees,
        champsManquants,
        sourcesEchouees,
      );
      // Reporter le résultat sur le site d'évaluation
      siteEval.presenceRisquesNaturels = siteEvalRisquesNaturels.presenceRisquesNaturels;

      // 7. RISQUES TECHNOLOGIQUES -> centroïde du site
      const risquesTechnologiquesResult =
        await this.risquesTechnologiquesEnrichissement.enrichir(siteEval);
      this.mergeEnrichmentResult(
        risquesTechnologiquesResult.result,
        sourcesUtilisees,
        champsManquants,
        sourcesEchouees,
      );

      // 8. GÉORISQUES RAW -> centroïde du site
      let risquesGeorisques;
      if (siteEval.coordonnees) {
        const georisquesResult = await this.georisquesEnrichissement.enrichir(siteEval.coordonnees);
        this.mergeEnrichmentResult(
          georisquesResult.result,
          sourcesUtilisees,
          champsManquants,
          sourcesEchouees,
        );
        risquesGeorisques = georisquesResult.data;
      }

      // 9. ZONAGES -> union (env/patri) + prédominante (réglementaire)
      let zonagesResult;
      const predominante = site.parcellePredominante;
      if (site.geometrieUnion && predominante.geometrie && siteEval.codeInsee) {
        zonagesResult = await this.zonageOrchestrator.enrichirZonagesSite(
          site.geometrieUnion,
          predominante.geometrie,
          siteEval.codeInsee,
        );
        this.mergeEnrichmentResult(
          zonagesResult.result,
          sourcesUtilisees,
          champsManquants,
          sourcesEchouees,
        );

        siteEval.zonageEnvironnemental = zonagesResult.zonageEnvironnemental;
        siteEval.zonagePatrimonial = zonagesResult.zonagePatrimonial;
        siteEval.zonageReglementaire = zonagesResult.zonageReglementaire;
      }

      // 10. POLLUTION -> centroïde du site
      let siteReferencePollue = false;
      if (siteEval.coordonnees) {
        const pollutionResult = await this.pollutionDetection.detecterPollution(
          siteEval.coordonnees.latitude,
          siteEval.coordonnees.longitude,
          siteEval.codeInsee,
        );
        siteReferencePollue = pollutionResult.siteReferencePollue;
        sourcesUtilisees.push(...pollutionResult.sourcesUtilisees);
        sourcesEchouees.push(...pollutionResult.sourcesEchouees);
      }

      // 11. DÉTERMINER LE STATUT
      const sourcesUniques = [...new Set(sourcesUtilisees)];
      const champsManquantsUniques = [...new Set(champsManquants)];

      if (sourcesEchouees.length === 0) {
        statut = StatutEnrichissement.SUCCES;
      } else if (sourcesUtilisees.length > 0) {
        statut = StatutEnrichissement.PARTIEL;
      } else {
        statut = StatutEnrichissement.ECHEC;
      }

      // 12. CONSTRUIRE LE DTO DE SORTIE
      result = {
        // Identification
        identifiantParcelle: site.identifiantsParcelles.join(","),
        codeInsee: site.communePredominante.codeInsee,
        commune: site.communePredominante.commune,
        coordonnees: site.centroidSite,
        geometrie: site.geometrieUnion,

        // Données multi-parcelle
        identifiantsParcelles: site.identifiantsParcelles,
        nombreParcelles: site.nombreParcelles,
        parcellePredominante: site.parcellePredominante.identifiantParcelle,
        communePredominante: site.communePredominante.commune,
        geometrieSite: site.geometrieUnion,

        // Données physiques
        surfaceSite: site.surfaceTotale,
        surfaceBati: site.surfaceBatieTotale,

        // Données enrichies
        distanceRaccordementElectrique: siteEval.distanceRaccordementElectrique,
        presenceRisquesNaturels: siteEval.presenceRisquesNaturels,
        siteEnCentreVille: siteEval.siteEnCentreVille,
        distanceAutoroute: siteEval.distanceAutoroute,
        distanceTransportCommun: siteEval.distanceTransportCommun,
        proximiteCommercesServices: siteEval.proximiteCommercesServices,
        tauxLogementsVacants: siteEval.tauxLogementsVacants,
        presenceRisquesTechnologiques: siteEval.presenceRisquesTechnologiques,
        siteReferencePollue,
        zonageEnvironnemental: siteEval.zonageEnvironnemental,
        zonageReglementaire: siteEval.zonageReglementaire,
        zonagePatrimonial: siteEval.zonagePatrimonial,
        trameVerteEtBleue: siteEval.trameVerteEtBleue,

        risquesGeorisques,

        // TODO: supprimer apres analyse - Diagnostic zonages (dev/staging)
        diagnosticZonages: zonagesResult?.diagnosticZonages,

        // Métadonnées
        sourcesUtilisees: sourcesUniques,
        champsManquants: champsManquantsUniques,
        sourcesEchouees: [...new Set(sourcesEchouees)],
      } as EnrichissementOutputDto;

      this.logger.log(
        `Enrichissement site terminé : ${site.nombreParcelles} parcelle(s) (statut: ${statut})`,
      );
    } catch (error) {
      statut = StatutEnrichissement.ECHEC;
      messageErreur =
        error instanceof Error
          ? error.message
          : MessagesErreurEnrichissement[CodeErreurEnrichissement.UNKNOWN_ERROR];
      codeErreur = CodeErreurEnrichissement.ENRICHISSEMENT_FAILED;

      this.logger.error(`Erreur enrichissement site [${identifiants.join(",")}]:`, messageErreur);

      this.saveSite(
        identifiants,
        undefined,
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

      throw error;
    }

    // Persister le site enrichi (non-bloquant)
    this.saveSite(
      identifiants,
      result.codeInsee,
      result.commune,
      result.parcellePredominante,
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
   * Construit un SiteEvaluation virtuel à partir d'un Site multi-parcellaire
   * Utilise le centroïde du site et la commune prédominante
   */
  private buildVirtualSiteEval(site: Site): SiteEvaluation {
    const siteEval = new SiteEvaluation();
    siteEval.identifiantParcelle = site.identifiantsParcelles.join(",");
    siteEval.codeInsee = site.communePredominante.codeInsee;
    siteEval.commune = site.communePredominante.commune;
    siteEval.coordonnees = site.centroidSite;
    siteEval.geometrie = site.geometrieUnion as GeometrieParcelle | undefined;
    siteEval.surfaceSite = site.surfaceTotale;
    siteEval.surfaceBati = site.surfaceBatieTotale;
    return siteEval;
  }

  /**
   * Construit un SiteEvaluation pour les risques naturels
   * Utilise les coordonnées de la parcelle prédominante
   */
  private buildSiteEvalPredominante(site: Site): SiteEvaluation {
    const predominante = site.parcellePredominante;
    const siteEval = new SiteEvaluation();
    siteEval.identifiantParcelle = predominante.identifiantParcelle;
    siteEval.codeInsee = predominante.codeInsee;
    siteEval.commune = predominante.commune;
    siteEval.coordonnees = predominante.coordonnees;
    siteEval.geometrie = predominante.geometrie as GeometrieParcelle | undefined;
    siteEval.surfaceSite = predominante.surface;
    return siteEval;
  }

  /**
   * Enregistre un site enrichi de manière non-bloquante
   */
  private saveSite(
    identifiants: string[],
    codeInsee: string | undefined,
    commune: string | undefined,
    parcellePredominante: string | undefined,
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
    this.siteRepository
      .save({
        identifiantsCadastraux: identifiants,
        nombreParcelles: identifiants.length,
        codeInsee,
        commune,
        parcellePredominante,
        statut,
        donnees,
        messageErreur,
        codeErreur,
        sourcesReussies,
        sourcesEchouees,
        dureeMs,
        sourceUtilisation,
        integrateur,
        versionApi: "1.0",
      })
      .catch((error) => {
        this.logger.error("Erreur lors de l'enregistrement du site:", error);
      });
  }

  /**
   * Enregistre une utilisation du cache site pour analytics (non-bloquant)
   */
  private saveCachedSite(
    identifiants: string[],
    donnees: EnrichissementOutputDto,
    siteSourceId: string,
    dureeMs: number,
    sourceUtilisation: string | undefined,
    integrateur: string | undefined,
  ): void {
    this.siteRepository
      .save({
        identifiantsCadastraux: identifiants,
        nombreParcelles: identifiants.length,
        codeInsee: donnees.codeInsee,
        commune: donnees.commune,
        parcellePredominante: donnees.parcellePredominante,
        statut: StatutEnrichissement.SUCCES,
        donnees,
        sourcesReussies: donnees.sourcesUtilisees,
        sourcesEchouees: [],
        dureeMs,
        sourceUtilisation,
        integrateur,
        versionApi: "1.0",
        siteSourceId,
      })
      .catch((error) => {
        this.logger.error("Erreur lors de l'enregistrement du cache site:", error);
      });
  }

  /**
   * Fusionne le résultat d'un sous-domaine dans les tableaux globaux
   */
  private mergeEnrichmentResult(
    result: { sourcesUtilisees: string[]; sourcesEchouees: string[]; champsManquants?: string[] },
    sourcesUtilisees: string[],
    champsManquants: string[],
    sourcesEchouees: string[],
  ): void {
    sourcesUtilisees.push(...result.sourcesUtilisees);
    sourcesEchouees.push(...result.sourcesEchouees);
    if (result.champsManquants) {
      champsManquants.push(...result.champsManquants);
    }
  }

  /**
   * Enregistre l'enrichissement de manière non-bloquante
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
        versionApi: "1.0",
      })
      .catch((error) => {
        // Ne pas bloquer si le log échoue, juste logger l'erreur
        this.logger.error("Erreur lors de l'enregistrement du log enrichissement:", error);
      });
  }

  /**
   * Enregistre une utilisation du cache pour analytics (non-bloquant)
   */
  private saveCachedEnrichissement(
    identifiantCadastral: string,
    donnees: EnrichissementOutputDto,
    enrichissementSourceId: string,
    dureeMs: number,
    sourceUtilisation: string | undefined,
    integrateur: string | undefined,
  ): void {
    this.enrichissementRepository
      .save({
        identifiantCadastral,
        codeInsee: donnees.codeInsee,
        commune: donnees.commune,
        statut: StatutEnrichissement.SUCCES,
        donnees,
        sourcesReussies: donnees.sourcesUtilisees,
        sourcesEchouees: [],
        dureeMs,
        sourceUtilisation,
        integrateur,
        versionApi: "1.0",
        enrichissementSourceId,
      })
      .catch((error) => {
        this.logger.error("Erreur lors de l'enregistrement du cache enrichissement:", error);
      });
  }
}
