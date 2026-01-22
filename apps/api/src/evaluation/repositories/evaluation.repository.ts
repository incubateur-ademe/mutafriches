import { Injectable, Logger } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { DatabaseService } from "../../shared/database/database.service";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import {
  EnrichissementOutputDto,
  DonneesComplementairesInputDto,
  MutabiliteOutputDto,
  OrigineUtilisation,
  SourceUtilisation,
} from "@mutafriches/shared-types";
import { evaluations } from "../../shared/database/schemas/evaluations.schema";
import { Evaluation } from "../entities/evaluation.entity";
import { hasJeNeSaisPas } from "../utils/cache-validator";

/** Duree de validite du cache des evaluations en heures */
export const EVALUATION_CACHE_TTL_HOURS = 24;

/** Resultat d'une evaluation en cache */
export interface CachedEvaluation {
  id: string;
  resultats: MutabiliteOutputDto;
  donneesEnrichissement: EnrichissementOutputDto;
  donneesComplementaires: DonneesComplementairesInputDto;
}

@Injectable()
export class EvaluationRepository {
  private readonly logger = new Logger(EvaluationRepository.name);

  constructor(private readonly database: DatabaseService) {}

  /**
   * Sauvegarde une évaluation en base
   */
  async save(evaluation: Evaluation, evaluationSourceId?: string): Promise<string> {
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
      evaluationSourceId,
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

  /**
   * Recherche une evaluation valide en cache pour une parcelle
   * Criteres : meme parcelle, meme donnees complementaires (hash), pas de "je ne sais pas", date < TTL
   */
  async findValidCache(
    parcelleId: string,
    donneesComplementaires: DonneesComplementairesInputDto,
  ): Promise<CachedEvaluation | null> {
    // Si les donnees complementaires contiennent "je ne sais pas", pas de cache
    if (hasJeNeSaisPas(donneesComplementaires)) {
      return null;
    }

    const ttlDate = new Date();
    ttlDate.setHours(ttlDate.getHours() - EVALUATION_CACHE_TTL_HOURS);

    // Rechercher les evaluations recentes pour cette parcelle
    const results = await this.database.db
      .select({
        id: evaluations.id,
        resultats: evaluations.resultats,
        donneesEnrichissement: evaluations.donneesEnrichissement,
        donneesComplementaires: evaluations.donneesComplementaires,
      })
      .from(evaluations)
      .where(and(eq(evaluations.parcelleId, parcelleId), gte(evaluations.dateCalcul, ttlDate)))
      .orderBy(sql`${evaluations.dateCalcul} DESC`)
      .limit(10); // Limiter pour performance

    // Chercher une evaluation avec les memes donnees complementaires et sans "je ne sais pas"
    for (const row of results) {
      const cachedDonnees = row.donneesComplementaires as DonneesComplementairesInputDto;

      // Verifier que les donnees complementaires sont identiques
      if (!this.areDonneesComplementairesEqual(donneesComplementaires, cachedDonnees)) {
        continue;
      }

      // Verifier que l'evaluation en cache n'a pas de "je ne sais pas"
      if (hasJeNeSaisPas(cachedDonnees)) {
        continue;
      }

      this.logger.log(`Cache evaluation trouve pour ${parcelleId}: ${row.id}`);

      return {
        id: row.id,
        resultats: row.resultats as MutabiliteOutputDto,
        donneesEnrichissement: row.donneesEnrichissement as EnrichissementOutputDto,
        donneesComplementaires: cachedDonnees,
      };
    }

    return null;
  }

  /**
   * Compare deux objets de donnees complementaires
   */
  private areDonneesComplementairesEqual(
    a: DonneesComplementairesInputDto,
    b: DonneesComplementairesInputDto,
  ): boolean {
    return (
      a.typeProprietaire === b.typeProprietaire &&
      a.raccordementEau === b.raccordementEau &&
      a.etatBatiInfrastructure === b.etatBatiInfrastructure &&
      a.presencePollution === b.presencePollution &&
      a.valeurArchitecturaleHistorique === b.valeurArchitecturaleHistorique &&
      a.qualitePaysage === b.qualitePaysage &&
      a.qualiteVoieDesserte === b.qualiteVoieDesserte &&
      a.trameVerteEtBleue === b.trameVerteEtBleue
    );
  }
}
