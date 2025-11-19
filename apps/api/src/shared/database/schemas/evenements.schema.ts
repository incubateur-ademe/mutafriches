import { pgTable, varchar, jsonb, timestamp, index, pgEnum } from "drizzle-orm/pg-core";
import { TypeEvenement } from "@mutafriches/shared-types";

export const typeEvenementEnum = pgEnum(
  "type_evenement_enum",
  Object.values(TypeEvenement) as [string, ...string[]],
);

export const evenements_utilisateur = pgTable(
  "evenements_utilisateur",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    typeEvenement: typeEvenementEnum("type_evenement").notNull(),
    evaluationId: varchar("evaluation_id", { length: 50 }),
    identifiantCadastral: varchar("identifiant_cadastral", { length: 20 }),
    donnees: jsonb("donnees"),
    dateCreation: timestamp("date_creation").notNull().defaultNow(),
    sourceUtilisation: varchar("source_utilisation", { length: 20 }),
    ref: varchar("ref", { length: 100 }),
    integrateur: varchar("integrateur", { length: 255 }),
    userAgent: varchar("user_agent", { length: 500 }),
    sessionId: varchar("session_id", { length: 100 }),
  },
  (table) => [
    index("idx_type_evenement").on(table.typeEvenement),
    index("idx_evaluation_id").on(table.evaluationId),
    index("idx_date_creation").on(table.dateCreation),
  ],
);
