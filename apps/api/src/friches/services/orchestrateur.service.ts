import { Injectable } from "@nestjs/common";
import {
  EnrichirParcelleInputDto,
  EnrichissementOutputDto,
  CalculerMutabiliteInputDto,
  MutabiliteOutputDto,
  DonneesComplementairesInputDto,
} from "@mutafriches/shared-types";
import { EnrichissementService } from "./enrichissement.service";
import { CalculService } from "./calcul.service";
import { Parcelle } from "../domain/entities/parcelle.entity";
import { Evaluation } from "../domain/entities/evaluation.entity";
import { EvaluationRepository } from "../repository/evaluation.repository";

/**
 * Service orchestrateur principal
 * Coordonne l'enrichissement, le calcul et la sauvegarde des évaluations
 */
@Injectable()
export class OrchestrateurService {
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
  async calculerMutabilite(input: CalculerMutabiliteInputDto): Promise<MutabiliteOutputDto> {
    // TODO Remove debug logs
    console.log("Input reçu:", JSON.stringify(input, null, 2));
    console.log("donneesEnrichies:", input.donneesEnrichies);
    console.log("donneesComplementaires:", input.donneesComplementaires);

    // Vérification des données
    if (!input.donneesEnrichies) {
      throw new Error("Données enrichies manquantes dans la requête");
    }

    // Crée l'entité Parcelle
    const parcelle = Parcelle.fromEnrichissement(
      input.donneesEnrichies,
      input.donneesComplementaires,
    );

    // Vérifie que la parcelle est complète
    if (!parcelle.estComplete()) {
      throw new Error("Parcelle incomplète pour le calcul");
    }

    // Lance le calcul
    const resultats = await this.calculService.calculer(parcelle);

    // Création d'une évaluation de mutabilité
    const evaluation = new Evaluation(
      parcelle.identifiantParcelle,
      input.donneesEnrichies,
      input.donneesComplementaires,
      resultats,
    );

    // Sauvegarde l'évaluation et retourne l'ID
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

    // 3. Sauvegarde
    const evaluation = new Evaluation(
      identifiant,
      enrichissement,
      donneesComplementaires,
      mutabilite,
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
