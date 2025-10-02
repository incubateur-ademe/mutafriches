import { pgTable, varchar, jsonb, timestamp, index } from "drizzle-orm/pg-core";

export const evenements_utilisateur = pgTable(
  "evenements_utilisateur",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    typeEvenement: varchar("type_evenement", { length: 50 }).notNull(),
    evaluationId: varchar("evaluation_id", { length: 50 }),
    identifiantCadastral: varchar("identifiant_cadastral", { length: 20 }),
    donnees: jsonb("donnees"),
    dateCreation: timestamp("date_creation").notNull().defaultNow(),
    sourceUtilisation: varchar("source_utilisation", { length: 20 }),
    integrateur: varchar("integrateur", { length: 255 }),
    userAgent: varchar("user_agent", { length: 500 }),
    sessionId: varchar("session_id", { length: 100 }),
  },
  (table) => {
    return {
      typeEvenementIdx: index("idx_type_evenement").on(table.typeEvenement),
      evaluationIdIdx: index("idx_evaluation_id").on(table.evaluationId),
      dateCreationIdx: index("idx_date_creation").on(table.dateCreation),
    };
  },
);
