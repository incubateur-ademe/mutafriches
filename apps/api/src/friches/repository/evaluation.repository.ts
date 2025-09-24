import { Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { DatabaseService } from "../../shared/database/database.service";
import { evaluations } from "../../shared/database/schema";
import { Evaluation } from "../domain/entities/evaluation.entity";
import { eq, desc } from "drizzle-orm";
import {
  EnrichissementOutputDto,
  DonneesComplementairesInputDto,
  MutabiliteOutputDto,
} from "@mutafriches/shared-types";

@Injectable()
export class EvaluationRepository {
  constructor(private readonly database: DatabaseService) {}

  /**
   * Sauvegarde une évaluation en base
   */
  async save(evaluation: Evaluation): Promise<string> {
    if (!evaluation.id) {
      evaluation.id = uuidv4();
    }

    await this.database.db.insert(evaluations).values({
      id: evaluation.id,
      codeInsee: evaluation.codeInsee,
      parcelleId: evaluation.parcelleId,
      dateCalcul: evaluation.dateCalcul,
      donneesEnrichissement: evaluation.donneesEnrichissement as any,
      donneesComplementaires: evaluation.donneesComplementaires as any,
      resultats: evaluation.resultats as any,
      fiabilite: String(evaluation.resultats.fiabilite.note),
      versionAlgorithme: evaluation.versionAlgorithme,
    });

    return evaluation.id;
  }

  /**
   * Récupère une évaluation par son ID
   */
  async findById(id: string): Promise<Evaluation | null> {
    const results = await this.database.db
      .select()
      .from(evaluations)
      .where(eq(evaluations.id, id))
      .limit(1);

    if (results.length === 0) return null;

    const row = results[0];

    // Reconstruire l'entité
    const evaluation = new Evaluation(
      row.parcelleId,
      row.codeInsee,
      row.donneesEnrichissement as EnrichissementOutputDto,
      row.donneesComplementaires as DonneesComplementairesInputDto,
      row.resultats as MutabiliteOutputDto,
    );

    // Réaffecter les propriétés manquantes
    evaluation.id = row.id;
    evaluation.dateCalcul = row.dateCalcul;
    evaluation.versionAlgorithme = row.versionAlgorithme;

    return evaluation;
  }

  /**
   * Récupère toutes les évaluations d'une parcelle
   */
  async findByParcelleId(parcelleId: string): Promise<Evaluation[]> {
    const results = await this.database.db
      .select()
      .from(evaluations)
      .where(eq(evaluations.parcelleId, parcelleId))
      .orderBy(desc(evaluations.dateCalcul));

    return results.map((row) => {
      const evaluation = new Evaluation(
        row.parcelleId,
        row.codeInsee,
        row.donneesEnrichissement as EnrichissementOutputDto,
        row.donneesComplementaires as DonneesComplementairesInputDto,
        row.resultats as MutabiliteOutputDto,
      );

      evaluation.id = row.id;
      evaluation.dateCalcul = row.dateCalcul;
      evaluation.versionAlgorithme = row.versionAlgorithme;

      return evaluation;
    });
  }
}
