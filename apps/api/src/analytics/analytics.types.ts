import type {
  userSessions,
  userActions,
  integrators,
} from './analytics.schema';

// Types inférés depuis le schéma
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;

export type UserAction = typeof userActions.$inferSelect;
export type NewUserAction = typeof userActions.$inferInsert;

export type Integrator = typeof integrators.$inferSelect;
export type NewIntegrator = typeof integrators.$inferInsert;

// Enums pour les types d'actions
export const ActionTypes = {
  PARCOURS_INITIATED: 'parcours_initiated',
  PARCOURS_COMPLETED: 'parcours_completed',
  DETAILS_CLICKED: 'details_clicked',
  CONTACT_CLICKED: 'contact_clicked',
  TOOL_LINK_CLICKED: 'tool_link_clicked',
  PERTINENCE_ANSWERED: 'pertinence_answered',
} as const;

export type ActionType = (typeof ActionTypes)[keyof typeof ActionTypes];

// Types métier pour l'analytics
export interface AnalyticsMetrics {
  totalSessions: number;
  completedSessions: number;
  detailsClicked: number;
  contactClicked: number;
  toolLinkClicked: number;
  pertinenceAnswered: number;
}

export interface IntegratorStats {
  name: string;
  sessions: number;
  percentage: number;
}

export interface ConversionRates {
  completionRate: number;
  detailsClickRate: number;
  contactClickRate: number;
  toolClickRate: number;
  pertinenceResponseRate: number;
}

export interface PertinenceStats {
  totalResponses: number;
  ouiCount: number;
  nonCount: number;
  ouiPercentage: number;
  nonPercentage: number;
  responseRate: number;
}
