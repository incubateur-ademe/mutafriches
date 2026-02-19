import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import type { Periodicity, Stat, StatOutput } from "@mutafriches/shared-types";
import { DatabaseService } from "../shared/database/database.service";
import { fillGaps } from "./utils/gap-fill.utils";

@Injectable()
export class StatsService {
  constructor(private readonly database: DatabaseService) {}

  async getAllStats(
    since: Date | null,
    periodicity: Periodicity,
  ): Promise<StatOutput[]> {
    const results = await Promise.all([
      this.getAnalysesAbouties(since, periodicity),
      this.getSurfaceAnalysee(since, periodicity),
      this.getCommunesDistinctes(since, periodicity),
      this.getVisites(since, periodicity),
      this.getSitesQualifies(since, periodicity),
      this.getMoyenneSitesParCommune(since, periodicity),
    ]);

    return results;
  }

  private async getAnalysesAbouties(
    since: Date | null,
    periodicity: Periodicity,
  ): Promise<StatOutput> {
    const rows = await this.queryByPeriod(
      "evaluations",
      "date_calcul",
      "evaluation_source_id IS NULL",
      since,
      periodicity,
    );

    return {
      description: "Analyses de mutabilité abouties",
      stats: fillGaps(rows, since, periodicity),
    };
  }

  private async getSurfaceAnalysee(
    since: Date | null,
    periodicity: Periodicity,
  ): Promise<StatOutput> {
    const truncExpr = this.dateTruncExpr(periodicity, "date_calcul");
    const whereClause = since
      ? sql`WHERE evaluation_source_id IS NULL AND donnees_enrichissement->>'surfaceSite' IS NOT NULL AND date_calcul >= ${since}`
      : sql`WHERE evaluation_source_id IS NULL AND donnees_enrichissement->>'surfaceSite' IS NOT NULL`;

    const result = await this.database.db.execute(sql`
      WITH parcelles_par_periode AS (
        SELECT
          ${truncExpr} AS period,
          parcelle_id,
          (donnees_enrichissement->>'surfaceSite')::NUMERIC AS surface_m2,
          ROW_NUMBER() OVER (PARTITION BY ${truncExpr}, parcelle_id ORDER BY date_calcul DESC) AS rn
        FROM evaluations
        ${whereClause}
      )
      SELECT
        period,
        ROUND(COALESCE(SUM(surface_m2) / 10000, 0), 2)::FLOAT AS value
      FROM parcelles_par_periode
      WHERE rn = 1
      GROUP BY period
      ORDER BY period
    `);

    const rows = (result as unknown as { period: Date; value: number }[]).map(
      (r) => ({
        value: Number(r.value),
        date: new Date(r.period).getTime(),
      }),
    );

    return {
      description: "Surface analysée (hectares, parcelles uniques)",
      stats: fillGaps(rows, since, periodicity),
    };
  }

  private async getCommunesDistinctes(
    since: Date | null,
    periodicity: Periodicity,
  ): Promise<StatOutput> {
    const truncExpr = this.dateTruncExpr(periodicity, "date_calcul");
    const whereClause = since
      ? sql`WHERE evaluation_source_id IS NULL AND date_calcul >= ${since}`
      : sql`WHERE evaluation_source_id IS NULL`;

    const result = await this.database.db.execute(sql`
      SELECT
        ${truncExpr} AS period,
        COUNT(DISTINCT code_insee)::INT AS value
      FROM evaluations
      ${whereClause}
      GROUP BY period
      ORDER BY period
    `);

    const rows = (result as unknown as { period: Date; value: number }[]).map(
      (r) => ({
        value: Number(r.value),
        date: new Date(r.period).getTime(),
      }),
    );

    return {
      description: "Communes distinctes avec analyse aboutie",
      stats: fillGaps(rows, since, periodicity),
    };
  }

  private async getVisites(
    since: Date | null,
    periodicity: Periodicity,
  ): Promise<StatOutput> {
    const rows = await this.queryByPeriod(
      "evenements_utilisateur",
      "date_creation",
      "type_evenement = 'visite'",
      since,
      periodicity,
    );

    return {
      description: "Visites",
      stats: fillGaps(rows, since, periodicity),
    };
  }

  private async getSitesQualifies(
    since: Date | null,
    periodicity: Periodicity,
  ): Promise<StatOutput> {
    const rows = await this.queryByPeriod(
      "enrichissements",
      "date_enrichissement",
      "statut IN ('succes', 'partiel') AND enrichissement_source_id IS NULL",
      since,
      periodicity,
    );

    return {
      description: "Sites qualifiés automatiquement",
      stats: fillGaps(rows, since, periodicity),
    };
  }

  private async getMoyenneSitesParCommune(
    since: Date | null,
    periodicity: Periodicity,
  ): Promise<StatOutput> {
    const truncExpr = this.dateTruncExpr(periodicity, "date_calcul");
    const whereClause = since
      ? sql`WHERE evaluation_source_id IS NULL AND date_calcul >= ${since}`
      : sql`WHERE evaluation_source_id IS NULL`;

    const result = await this.database.db.execute(sql`
      WITH par_commune_par_periode AS (
        SELECT
          ${truncExpr} AS period,
          code_insee,
          COUNT(DISTINCT parcelle_id)::INT AS nb_parcelles
        FROM evaluations
        ${whereClause}
        GROUP BY period, code_insee
      )
      SELECT
        period,
        ROUND(AVG(nb_parcelles), 1)::FLOAT AS value
      FROM par_commune_par_periode
      GROUP BY period
      ORDER BY period
    `);

    const rows = (result as unknown as { period: Date; value: number }[]).map(
      (r) => ({
        value: Number(r.value),
        date: new Date(r.period).getTime(),
      }),
    );

    return {
      description: "Nombre moyen de sites analysés par commune",
      stats: fillGaps(rows, since, periodicity),
    };
  }

  /**
   * Requête COUNT(*) générique par période avec DATE_TRUNC
   */
  private async queryByPeriod(
    table: string,
    dateColumn: string,
    whereCondition: string,
    since: Date | null,
    periodicity: Periodicity,
  ): Promise<Stat[]> {
    const sinceCondition = since
      ? `AND ${dateColumn} >= '${since.toISOString()}'`
      : "";

    // periodicity est validé dans le controller contre isValidPeriodicity
    const query = `
      SELECT
        DATE_TRUNC('${periodicity}', ${dateColumn}) AS period,
        COUNT(*)::INT AS value
      FROM ${table}
      WHERE ${whereCondition} ${sinceCondition}
      GROUP BY period
      ORDER BY period
    `;

    const result = await this.database.db.execute(sql.raw(query));

    return (result as unknown as { period: Date; value: number }[]).map(
      (r) => ({
        value: Number(r.value),
        date: new Date(r.period).getTime(),
      }),
    );
  }

  /**
   * Génère une expression DATE_TRUNC SQL pour Drizzle
   */
  private dateTruncExpr(periodicity: Periodicity, column: string) {
    // periodicity est validé en amont, pas de risque d'injection
    return sql.raw(`DATE_TRUNC('${periodicity}', ${column})`);
  }
}
