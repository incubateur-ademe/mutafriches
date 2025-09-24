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
  OrigineUtilisation,
} from "@mutafriches/shared-types";
import { SourceUtilisation } from "@mutafriches/shared-types/dist/enums/usage.enums";

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
      sourceUtilisation: evaluation.origine.source,
      integrateur: evaluation.origine.integrateur,
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

    // Reconstruire l'origine depuis la DB
    const origine: OrigineUtilisation = {
      source: row.sourceUtilisation as SourceUtilisation,
      integrateur: row.integrateur || undefined,
    };

    // Reconstruire l'entité
    const evaluation = new Evaluation(
      row.parcelleId,
      row.codeInsee,
      row.donneesEnrichissement as EnrichissementOutputDto,
      row.donneesComplementaires as DonneesComplementairesInputDto,
      row.resultats as MutabiliteOutputDto,
      origine,
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
      const origine: OrigineUtilisation = {
        source: row.sourceUtilisation as SourceUtilisation,
        integrateur: row.integrateur || undefined,
      };

      const evaluation = new Evaluation(
        row.parcelleId,
        row.codeInsee,
        row.donneesEnrichissement as EnrichissementOutputDto,
        row.donneesComplementaires as DonneesComplementairesInputDto,
        row.resultats as MutabiliteOutputDto,
        origine,
      );

      evaluation.id = row.id;
      evaluation.dateCalcul = row.dateCalcul;
      evaluation.versionAlgorithme = row.versionAlgorithme;

      return evaluation;
    });
  }
}
