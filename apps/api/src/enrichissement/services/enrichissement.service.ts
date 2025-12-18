import { Injectable, Logger } from "@nestjs/common";
import {
  CodeErreurEnrichissement,
  EnrichissementOutputDto,
  MessagesErreurEnrichissement,
  StatutEnrichissement,
} from "@mutafriches/shared-types";
import { EnrichissementRepository } from "../repositories/enrichissement.repository";
import { CadastreEnrichissementService } from "./cadastre/cadastre-enrichissement.service";
import { EnergieEnrichissementService } from "./energie/energie-enrichissement.service";
import { TransportEnrichissementService } from "./transport/transport-enrichissement.service";
import { UrbanismeEnrichissementService } from "./urbanisme/urbanisme-enrichissement.service";
import { RisquesNaturelsEnrichissementService } from "./risques-naturels/risques-naturels-enrichissement.service";
import { RisquesTechnologiquesEnrichissementService } from "./risques-technologiques/risques-technologiques-enrichissement.service";
import { GeoRisquesEnrichissementService } from "./georisques/georisques-enrichissement.service";
import { ZonageOrchestratorService } from "./zonage";

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

    // Utilitaires
    private readonly enrichissementRepository: EnrichissementRepository,
  ) {}

  /**
   * Enrichit une parcelle depuis toutes les sources externes disponibles
   *
   * @param identifiantParcelle - Identifiant cadastral de la parcelle
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
    const sourcesUtilisees: string[] = [];
    const champsManquants: string[] = [];
    const sourcesEchouees: string[] = [];

    let result: EnrichissementOutputDto;
    let statut = StatutEnrichissement.SUCCES;
    let messageErreur: string | undefined;
    let codeErreur: CodeErreurEnrichissement | undefined;

    try {
      // 1. CADASTRE + BDNB (obligatoire - initialise la parcelle)
      this.logger.log(`Debut enrichissement: ${identifiantParcelle}`);
      const cadastreResult = await this.cadastreEnrichissement.enrichir(identifiantParcelle);

      if (!cadastreResult.parcelle) {
        throw new Error(
          MessagesErreurEnrichissement[CodeErreurEnrichissement.CADASTRE_INTROUVABLE],
        );
      }

      const parcelle = cadastreResult.parcelle;
      this.mergeEnrichmentResult(
        cadastreResult.result,
        sourcesUtilisees,
        champsManquants,
        sourcesEchouees,
      );

      // 2. ENERGIE (distance raccordement électrique)
      const energieResult = await this.energieEnrichissement.enrichir(parcelle);
      this.mergeEnrichmentResult(energieResult, sourcesUtilisees, champsManquants, sourcesEchouees);

      // 3. TRANSPORT (distance transport en commun)
      const transportResult = await this.transportEnrichissement.enrichir(parcelle);
      this.mergeEnrichmentResult(
        transportResult,
        sourcesUtilisees,
        champsManquants,
        sourcesEchouees,
      );

      // 4. URBANISME (commerces, logements vacants, centre-ville)
      const urbanismeResult = await this.urbanismeEnrichissement.enrichir(parcelle);
      this.mergeEnrichmentResult(
        urbanismeResult,
        sourcesUtilisees,
        champsManquants,
        sourcesEchouees,
      );

      // 5. RISQUES NATURELS (RGA + Cavités)
      const risquesNaturelsResult = await this.risquesNaturelsEnrichissement.enrichir(parcelle);
      this.mergeEnrichmentResult(
        risquesNaturelsResult.result,
        sourcesUtilisees,
        champsManquants,
        sourcesEchouees,
      );

      // 6. RISQUES TECHNOLOGIQUES (SIS + ICPE)
      const risquesTechnologiquesResult =
        await this.risquesTechnologiquesEnrichissement.enrichir(parcelle);
      this.mergeEnrichmentResult(
        risquesTechnologiquesResult.result,
        sourcesUtilisees,
        champsManquants,
        sourcesEchouees,
      );

      // 7. GEORISQUES RAW (13 APIs pour intégrateurs)
      let risquesGeorisques;
      if (parcelle.coordonnees) {
        const georisquesResult = await this.georisquesEnrichissement.enrichir(parcelle.coordonnees);
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
      if (parcelle.geometrie && parcelle.codeInsee) {
        zonagesResult = await this.zonageOrchestrator.enrichirZonages(
          parcelle.geometrie,
          parcelle.codeInsee,
        );
        this.mergeEnrichmentResult(
          zonagesResult.result,
          sourcesUtilisees,
          champsManquants,
          sourcesEchouees,
        );

        // Affecter les zonages à la parcelle
        parcelle.zonageEnvironnemental = zonagesResult.zonageEnvironnemental;
        parcelle.zonagePatrimonial = zonagesResult.zonagePatrimonial;
        parcelle.zonageReglementaire = zonagesResult.zonageReglementaire;
      }

      // 9. CALCULER LA FIABILITÉ
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
}
