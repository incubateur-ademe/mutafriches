import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';

// Import des tables
import {
  userSessions,
  userActions,
  integrators,
  mutabilityResults,
} from '../database/schema';

// Import des types
import type {
  UserSession,
  NewUserSession,
  UserAction,
  NewUserAction,
  Integrator,
  NewIntegrator,
  MutabilityResult,
  NewMutabilityResult,
} from '../database/schema';

@Injectable()
export class AnalyticsService {
  constructor(private databaseService: DatabaseService) {}

  async createIntegrator(integrator: NewIntegrator): Promise<Integrator[]> {
    return await this.databaseService.db
      .insert(integrators)
      .values(integrator)
      .returning();
  }

  async getAllIntegrators(): Promise<Integrator[]> {
    return await this.databaseService.db.select().from(integrators);
  }

  async createUserSession(session: NewUserSession): Promise<UserSession[]> {
    return await this.databaseService.db
      .insert(userSessions)
      .values(session)
      .returning();
  }

  async getAllSessions(): Promise<UserSession[]> {
    return await this.databaseService.db.select().from(userSessions);
  }

  async trackUserAction(action: NewUserAction): Promise<UserAction[]> {
    return await this.databaseService.db
      .insert(userActions)
      .values(action)
      .returning();
  }

  async getAllActions(): Promise<UserAction[]> {
    return await this.databaseService.db.select().from(userActions);
  }

  async saveResult(result: NewMutabilityResult): Promise<MutabilityResult[]> {
    return await this.databaseService.db
      .insert(mutabilityResults)
      .values(result)
      .returning();
  }

  async getAllResults(): Promise<MutabilityResult[]> {
    return await this.databaseService.db.select().from(mutabilityResults);
  }

  async clearAllData(): Promise<void> {
    await this.databaseService.db.delete(userActions);
    await this.databaseService.db.delete(mutabilityResults);
    await this.databaseService.db.delete(userSessions);
    await this.databaseService.db.delete(integrators);
  }
}
