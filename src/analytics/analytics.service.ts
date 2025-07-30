import { Injectable } from '@nestjs/common';
import { eq, desc, count, isNotNull } from 'drizzle-orm';
import { userSessions, userActions, integrators } from './analytics.schema';
import { mutabilityResults } from '../mutability/mutability.schema';
import {
  type NewUserSession,
  type NewUserAction,
  type NewIntegrator,
  type UserSession,
  type UserAction,
  type Integrator,
  type AnalyticsMetrics,
  type IntegratorStats,
  type ConversionRates,
  type PertinenceStats,
  ActionTypes,
} from './analytics.types';
import type {
  NewMutabilityResult,
  PertinenceReponse,
} from '../mutability/mutability.types';
import { DatabaseService } from '../shared/database/database.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly databaseService: DatabaseService) {}

  private get db() {
    return this.databaseService.db;
  }

  // Gestion des sessions utilisateur
  async createUserSession(data: NewUserSession): Promise<UserSession[]> {
    return this.db.insert(userSessions).values(data).returning();
  }

  async getUserSession(sessionId: string): Promise<UserSession | undefined> {
    const results = await this.db
      .select()
      .from(userSessions)
      .where(eq(userSessions.sessionId, sessionId))
      .limit(1);

    return results[0];
  }

  // Gestion des actions utilisateur
  async trackUserAction(data: NewUserAction): Promise<UserAction[]> {
    return this.db.insert(userActions).values(data).returning();
  }

  async getUserActions(sessionId: string): Promise<UserAction[]> {
    return this.db
      .select()
      .from(userActions)
      .where(eq(userActions.sessionId, sessionId))
      .orderBy(desc(userActions.timestamp));
  }

  // Gestion des intégrateurs
  async createIntegrator(data: NewIntegrator): Promise<Integrator[]> {
    return this.db.insert(integrators).values(data).returning();
  }

  async getIntegrators(): Promise<Integrator[]> {
    return this.db.select().from(integrators);
  }

  // Méthodes pour les résultats de mutabilité
  async saveResult(data: {
    sessionId: string;
    indiceResidentiel: number;
    indiceEquipements: number;
    indiceCulture: number;
    indiceTertiaire: number;
    indiceIndustrie: number;
    indiceRenaturation: number;
    indicePhotovoltaique: number;
    fiabilite: string;
    pertinenceReponse?: string;
    createdAt?: Date;
  }) {
    const insertData: NewMutabilityResult = {
      sessionId: data.sessionId,
      indiceResidentiel: data.indiceResidentiel,
      indiceEquipements: data.indiceEquipements,
      indiceCulture: data.indiceCulture,
      indiceTertiaire: data.indiceTertiaire,
      indiceIndustrie: data.indiceIndustrie,
      indiceRenaturation: data.indiceRenaturation,
      indicePhotovoltaique: data.indicePhotovoltaique,
      fiabilite: data.fiabilite,
      pertinenceReponse: data.pertinenceReponse || null,
      createdAt: data.createdAt,
    };

    return this.db.insert(mutabilityResults).values(insertData).returning();
  }

  // Méthode pour mettre à jour la pertinence
  async updatePertinenceReponse(sessionId: string, reponse: PertinenceReponse) {
    return this.db
      .update(mutabilityResults)
      .set({ pertinenceReponse: reponse })
      .where(eq(mutabilityResults.sessionId, sessionId))
      .returning();
  }

  // Méthode pour récupérer les stats de pertinence
  async getPertinenceStats(): Promise<PertinenceStats> {
    // Récupérer toutes les réponses de pertinence
    const results = await this.db
      .select({
        pertinenceReponse: mutabilityResults.pertinenceReponse,
      })
      .from(mutabilityResults)
      .where(isNotNull(mutabilityResults.pertinenceReponse));

    // Compter le total de sessions terminées
    const totalCompletedSessions = await this.db
      .select()
      .from(mutabilityResults);

    const totalResponses = results.length;
    const totalCompleted = totalCompletedSessions.length;
    const ouiCount = results.filter(
      (r) => r.pertinenceReponse === 'OUI',
    ).length;
    const nonCount = results.filter(
      (r) => r.pertinenceReponse === 'NON',
    ).length;

    return {
      totalResponses,
      ouiCount,
      nonCount,
      ouiPercentage: totalResponses > 0 ? (ouiCount / totalResponses) * 100 : 0,
      nonPercentage: totalResponses > 0 ? (nonCount / totalResponses) * 100 : 0,
      responseRate:
        totalCompleted > 0 ? (totalResponses / totalCompleted) * 100 : 0,
    };
  }

  // Méthodes d'analytics
  async getAnalyticsMetrics(): Promise<AnalyticsMetrics> {
    const totalSessionsResult = await this.db
      .select({ count: count() })
      .from(userSessions);

    const completedSessionsResult = await this.db
      .select({ count: count() })
      .from(userActions)
      .where(eq(userActions.actionType, ActionTypes.PARCOURS_COMPLETED));

    const detailsClickedResult = await this.db
      .select({ count: count() })
      .from(userActions)
      .where(eq(userActions.actionType, ActionTypes.DETAILS_CLICKED));

    const contactClickedResult = await this.db
      .select({ count: count() })
      .from(userActions)
      .where(eq(userActions.actionType, ActionTypes.CONTACT_CLICKED));

    const toolLinkClickedResult = await this.db
      .select({ count: count() })
      .from(userActions)
      .where(eq(userActions.actionType, ActionTypes.TOOL_LINK_CLICKED));

    const pertinenceAnsweredResult = await this.db
      .select({ count: count() })
      .from(userActions)
      .where(eq(userActions.actionType, ActionTypes.PERTINENCE_ANSWERED));

    return {
      totalSessions: totalSessionsResult[0]?.count || 0,
      completedSessions: completedSessionsResult[0]?.count || 0,
      detailsClicked: detailsClickedResult[0]?.count || 0,
      contactClicked: contactClickedResult[0]?.count || 0,
      toolLinkClicked: toolLinkClickedResult[0]?.count || 0,
      pertinenceAnswered: pertinenceAnsweredResult[0]?.count || 0,
    };
  }

  async getIntegratorStats(): Promise<IntegratorStats[]> {
    const results = await this.db
      .select({
        name: userSessions.integratorName,
        count: count(),
      })
      .from(userSessions)
      .groupBy(userSessions.integratorName);

    const total = results.reduce((sum, item) => sum + item.count, 0);

    return results.map((item) => ({
      name: item.name,
      sessions: item.count,
      percentage: total > 0 ? (item.count / total) * 100 : 0,
    }));
  }

  async getConversionRates(): Promise<ConversionRates> {
    const metrics = await this.getAnalyticsMetrics();
    const {
      totalSessions,
      completedSessions,
      detailsClicked,
      contactClicked,
      toolLinkClicked,
      pertinenceAnswered,
    } = metrics;

    return {
      completionRate:
        totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      detailsClickRate:
        completedSessions > 0 ? (detailsClicked / completedSessions) * 100 : 0,
      contactClickRate:
        completedSessions > 0 ? (contactClicked / completedSessions) * 100 : 0,
      toolClickRate:
        completedSessions > 0 ? (toolLinkClicked / completedSessions) * 100 : 0,
      pertinenceResponseRate:
        completedSessions > 0
          ? (pertinenceAnswered / completedSessions) * 100
          : 0,
    };
  }

  // Méthode pour nettoyer toutes les données
  async clearAllData(): Promise<void> {
    await this.db.delete(userActions);
    await this.db.delete(mutabilityResults);
    await this.db.delete(userSessions);
    await this.db.delete(integrators);
  }
}
