import { pgTable, varchar, jsonb, timestamp, integer, index } from "drizzle-orm/pg-core";

export const logs_enrichissement = pgTable(
  "logs_enrichissement",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    identifiantCadastral: varchar("identifiant_cadastral", { length: 20 }).notNull(),
    codeInsee: varchar("code_insee", { length: 5 }),
    commune: varchar("commune", { length: 255 }),
    statut: varchar("statut", { length: 20 }).notNull(),
    donnees: jsonb("donnees"),
    messageErreur: varchar("message_erreur", { length: 1000 }),
    codeErreur: varchar("code_erreur", { length: 50 }),
    sourcesReussies: jsonb("sources_reussies"),
    sourcesEchouees: jsonb("sources_echouees"),
    dateEnrichissement: timestamp("date_enrichissement").notNull().defaultNow(),
    dureeMs: integer("duree_ms"),
    sourceUtilisation: varchar("source_utilisation", { length: 20 }),
    integrateur: varchar("integrateur", { length: 255 }),
    versionApi: varchar("version_api", { length: 20 }),
  },
  (table) => {
    return {
      identifiantIdx: index("idx_logs_enrichissement_identifiant").on(table.identifiantCadastral),
      statutIdx: index("idx_logs_enrichissement_statut").on(table.statut),
      dateIdx: index("idx_logs_enrichissement_date").on(table.dateEnrichissement),
    };
  },
);
