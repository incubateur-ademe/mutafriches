import { Injectable, Logger } from "@nestjs/common";
import {
  EnrichirParcelleInputDto,
  EnrichissementOutputDto,
  CalculerMutabiliteInputDto,
  MutabiliteOutputDto,
  DonneesComplementairesInputDto,
  OrigineUtilisation,
  SourceUtilisation,
} from "@mutafriches/shared-types";
import { EnrichissementService } from "../../enrichissement/services/enrichissement.service";
import { CalculService, CalculOptions } from "./calcul.service";
import { Site } from "../entities/site.entity";
import { Evaluation } from "../entities/evaluation.entity";
import { EvaluationRepository } from "../repositories/evaluation.repository";

/**
 * Service orchestrateur principal
 * Coordonne l'enrichissement, le calcul et la sauvegarde des évaluations
 */
@Injectable()
export class OrchestrateurService {
  private readonly logger = new Logger(OrchestrateurService.name);

  constructor(
    private readonly enrichissementService: EnrichissementService,
    private readonly calculService: CalculService,
    private readonly evaluationRepository: EvaluationRepository,
  ) {}

  /**
   * Enrichit un site (1 ou plusieurs parcelles) avec les données externes
   */
  async enrichirSite(input: EnrichirParcelleInputDto): Promise<EnrichissementOutputDto> {
    // Délègue à l'enrichissement service
    return await this.enrichissementService.enrichir(input.identifiant);
  }

  /**
   * Calcule la mutabilité d'un site
   */
  async calculerMutabilite(
    input: CalculerMutabiliteInputDto,
    options?: {
      modeDetaille?: boolean;
      sansEnrichissement?: boolean;
      origine?: OrigineUtilisation;
      versionAlgorithme?: string;
    },
  ): Promise<MutabiliteOutputDto> {
    // Vérification des données
    if (!input.donneesEnrichies) {
      throw new Error("Données enrichies manquantes dans la requête");
    }

    // identifiantParcelle du DTO contient l'identifiant du site (contrat API public inchangé)
    const siteId = input.donneesEnrichies.identifiantParcelle;
    const nombreParcelles = input.donneesEnrichies.nombreParcelles;

    // Bypass du cache si version non courante (comparaison = transient)
    const utiliserCache = !options?.versionAlgorithme;

    // 0. VERIFIER LE CACHE
    const cached = utiliserCache
      ? await this.evaluationRepository.findValidCache(siteId, input.donneesComplementaires)
      : null;

    if (cached) {
      this.logger.log(`Cache evaluation hit pour site ${siteId}, source: ${cached.id}`);

      // Origine par défaut si non fournie
      const origine = options?.origine || { source: SourceUtilisation.API_DIRECTE };

      // Enregistrer l'utilisation du cache pour analytics
      const evaluation = new Evaluation(
        siteId,
        input.donneesEnrichies.codeInsee,
        input.donneesEnrichies,
        input.donneesComplementaires,
        cached.resultats,
        origine,
        nombreParcelles,
      );

      const evaluationId = await this.evaluationRepository.save(evaluation, cached.id);

      return {
        ...cached.resultats,
        evaluationId,
      };
    }

    this.logger.log(`Cache evaluation miss pour site ${siteId}, calcul complet`);

    // Crée l'entité Site selon le mode
    let site: Site;

    if (options?.sansEnrichissement) {
      // Mode sans enrichissement : utilise directement l'input
      // Utilisé pour les tests avec des données complètes
      site = Site.fromInput(input);
    } else {
      // Mode normal : crée depuis l'enrichissement
      site = Site.fromEnrichissement(input.donneesEnrichies, input.donneesComplementaires);
    }

    // Vérifie que le site est complet
    if (!site.estComplete()) {
      throw new Error("Site incomplet pour le calcul");
    }

    // Lance le calcul
    const resultats = await this.calculService.calculer(site, options);

    // Origine par défaut si non fournie
    const origine = options?.origine || { source: SourceUtilisation.API_DIRECTE };

    // Création d'une évaluation de mutabilité
    const evaluation = new Evaluation(
      siteId,
      site.codeInsee,
      input.donneesEnrichies,
      input.donneesComplementaires,
      resultats,
      origine,
      nombreParcelles,
    );

    // Sauvegarde l'évaluation et retourne l'id
    const evaluationId = await this.evaluationRepository.save(evaluation);

    return {
      ...resultats,
      evaluationId,
    };
  }

  /**
   * Enrichit ET calcule en une seule fois
   */
  async evaluerSite(
    identifiant: string,
    donneesComplementaires: DonneesComplementairesInputDto,
    origine?: OrigineUtilisation,
  ): Promise<{
    enrichissement: EnrichissementOutputDto;
    mutabilite: MutabiliteOutputDto;
    evaluationId?: string;
  }> {
    // 1. Enrichissement
    const enrichissement = await this.enrichirSite({ identifiant });

    // 2. Calcul
    const mutabilite = await this.calculerMutabilite({
      donneesEnrichies: enrichissement,
      donneesComplementaires,
    });

    // Origine par défaut si non fournie
    const origineFinale = origine || { source: SourceUtilisation.API_DIRECTE };

    // 3. Sauvegarde
    const evaluation = new Evaluation(
      enrichissement.identifiantParcelle,
      enrichissement.codeInsee,
      enrichissement,
      donneesComplementaires,
      mutabilite,
      origineFinale,
      enrichissement.nombreParcelles,
    );

    const evaluationId = await this.evaluationRepository.save(evaluation);

    return {
      enrichissement,
      mutabilite,
      evaluationId,
    };
  }

  /**
   * Récupère une évaluation existante
   */
  async recupererEvaluation(evaluationId: string): Promise<Evaluation | null> {
    return await this.evaluationRepository.findById(evaluationId);
  }

  /**
   * Compare les résultats de mutabilité pour plusieurs versions de l'algorithme
   * Pas de cache, pas de persistance (comparaison = transient)
   */
  async comparerMutabilite(
    input: CalculerMutabiliteInputDto,
    versions: string[],
    options?: { sansEnrichissement?: boolean },
  ): Promise<Record<string, MutabiliteOutputDto>> {
    if (!input.donneesEnrichies) {
      throw new Error("Données enrichies manquantes dans la requête");
    }

    // Crée le site une seule fois
    let site: Site;
    if (options?.sansEnrichissement) {
      site = Site.fromInput(input);
    } else {
      site = Site.fromEnrichissement(input.donneesEnrichies, input.donneesComplementaires);
    }

    if (!site.estComplete()) {
      throw new Error("Site incomplet pour le calcul");
    }

    // Calculer en parallèle pour chaque version
    const resultats = await Promise.all(
      versions.map(async (version) => {
        const calcOptions: CalculOptions = {
          modeDetaille: true,
          versionAlgorithme: version,
        };
        const resultat = await this.calculService.calculer(site, calcOptions);
        return { version, resultat };
      }),
    );

    // Construire le record version -> résultat
    const comparaison: Record<string, MutabiliteOutputDto> = {};
    for (const { version, resultat } of resultats) {
      comparaison[version] = resultat;
    }

    return comparaison;
  }
}
