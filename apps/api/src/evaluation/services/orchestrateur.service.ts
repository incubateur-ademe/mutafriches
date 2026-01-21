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
import { CalculService } from "./calcul.service";
import { Parcelle } from "../entities/parcelle.entity";
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
   * Enrichit une parcelle avec les données externes
   */
  async enrichirParcelle(input: EnrichirParcelleInputDto): Promise<EnrichissementOutputDto> {
    // Délègue à l'enrichissement service
    return await this.enrichissementService.enrichir(input.identifiant);
  }

  /**
   * Calcule la mutabilité d'une parcelle
   */
  async calculerMutabilite(
    input: CalculerMutabiliteInputDto,
    options?: {
      modeDetaille?: boolean;
      sansEnrichissement?: boolean;
      origine?: OrigineUtilisation;
    },
  ): Promise<MutabiliteOutputDto> {
    // Vérification des données
    if (!input.donneesEnrichies) {
      throw new Error("Données enrichies manquantes dans la requête");
    }

    const parcelleId = input.donneesEnrichies.identifiantParcelle;

    // 0. VERIFIER LE CACHE
    const cached = await this.evaluationRepository.findValidCache(
      parcelleId,
      input.donneesComplementaires,
    );

    if (cached) {
      this.logger.log(`Cache hit evaluation pour ${parcelleId}, source: ${cached.id}`);

      // Origine par défaut si non fournie
      const origine = options?.origine || { source: SourceUtilisation.API_DIRECTE };

      // Enregistrer l'utilisation du cache pour analytics
      const evaluation = new Evaluation(
        parcelleId,
        input.donneesEnrichies.codeInsee,
        input.donneesEnrichies,
        input.donneesComplementaires,
        cached.resultats,
        origine,
      );

      const evaluationId = await this.evaluationRepository.save(evaluation, cached.id);

      return {
        ...cached.resultats,
        evaluationId,
      };
    }

    this.logger.log(`Cache miss evaluation pour ${parcelleId}, calcul complet`);

    // Crée l'entité Parcelle selon le mode
    let parcelle: Parcelle;

    if (options?.sansEnrichissement) {
      // Mode sans enrichissement : utilise directement l'input
      // Utilisé pour les tests avec des données complètes
      parcelle = Parcelle.fromInput(input);
    } else {
      // Mode normal : crée depuis l'enrichissement
      parcelle = Parcelle.fromEnrichissement(input.donneesEnrichies, input.donneesComplementaires);
    }

    // Vérifie que la parcelle est complète
    if (!parcelle.estComplete()) {
      throw new Error("Parcelle incomplète pour le calcul");
    }

    // Lance le calcul
    const resultats = await this.calculService.calculer(parcelle, options);

    // Origine par défaut si non fournie
    const origine = options?.origine || { source: SourceUtilisation.API_DIRECTE };

    // Création d'une évaluation de mutabilité
    const evaluation = new Evaluation(
      parcelle.identifiantParcelle,
      parcelle.codeInsee,
      input.donneesEnrichies,
      input.donneesComplementaires,
      resultats,
      origine,
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
  async evaluerParcelle(
    identifiant: string,
    donneesComplementaires: DonneesComplementairesInputDto,
    origine?: OrigineUtilisation,
  ): Promise<{
    enrichissement: EnrichissementOutputDto;
    mutabilite: MutabiliteOutputDto;
    evaluationId?: string;
  }> {
    // 1. Enrichissement
    const enrichissement = await this.enrichirParcelle({ identifiant });

    // 2. Calcul
    const mutabilite = await this.calculerMutabilite({
      donneesEnrichies: enrichissement,
      donneesComplementaires,
    });

    // Origine par défaut si non fournie
    const origineFinale = origine || { source: SourceUtilisation.API_DIRECTE };

    // 3. Sauvegarde
    const evaluation = new Evaluation(
      identifiant,
      enrichissement.codeInsee,
      enrichissement,
      donneesComplementaires,
      mutabilite,
      origineFinale,
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
}
