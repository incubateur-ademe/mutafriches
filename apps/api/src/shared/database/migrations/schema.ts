import { pgTable, varchar, timestamp, jsonb, numeric, index, integer } from "drizzle-orm/pg-core";

export const evaluations = pgTable("evaluations", {
  id: varchar({ length: 50 }).primaryKey().notNull(),
  parcelleId: varchar("parcelle_id", { length: 20 }).notNull(),
  codeInsee: varchar("code_insee", { length: 5 }).notNull(),
  dateCalcul: timestamp("date_calcul", { mode: "string" }).defaultNow().notNull(),
  donneesEnrichissement: jsonb("donnees_enrichissement").notNull(),
  donneesComplementaires: jsonb("donnees_complementaires").notNull(),
  resultats: jsonb().notNull(),
  fiabilite: numeric().notNull(),
  versionAlgorithme: varchar("version_algorithme", { length: 20 }).notNull(),
  sourceUtilisation: varchar("source_utilisation", { length: 20 }).notNull(),
  integrateur: varchar({ length: 255 }),
  utilisateurId: varchar("utilisateur_id", { length: 50 }),
  commentaire: varchar({ length: 1000 }),
});

export const evenementsUtilisateur = pgTable(
  "evenements_utilisateur",
  {
    id: varchar({ length: 50 }).primaryKey().notNull(),
    typeEvenement: varchar("type_evenement", { length: 50 }).notNull(),
    evaluationId: varchar("evaluation_id", { length: 50 }),
    identifiantCadastral: varchar("identifiant_cadastral", { length: 20 }),
    donnees: jsonb(),
    dateCreation: timestamp("date_creation", { mode: "string" }).defaultNow().notNull(),
    sourceUtilisation: varchar("source_utilisation", { length: 20 }),
    integrateur: varchar({ length: 255 }),
    userAgent: varchar("user_agent", { length: 500 }),
    sessionId: varchar("session_id", { length: 100 }),
  },
  (table) => [
    index("idx_date_creation").using(
      "btree",
      table.dateCreation.asc().nullsLast().op("timestamp_ops"),
    ),
    index("idx_evaluation_id").using("btree", table.evaluationId.asc().nullsLast().op("text_ops")),
    index("idx_type_evenement").using(
      "btree",
      table.typeEvenement.asc().nullsLast().op("text_ops"),
    ),
  ],
);

export const logsEnrichissement = pgTable(
  "logs_enrichissement",
  {
    id: varchar({ length: 50 }).primaryKey().notNull(),
    identifiantCadastral: varchar("identifiant_cadastral", { length: 20 }).notNull(),
    codeInsee: varchar("code_insee", { length: 5 }),
    commune: varchar({ length: 255 }),
    statut: varchar({ length: 20 }).notNull(),
    donnees: jsonb(),
    messageErreur: varchar("message_erreur", { length: 1000 }),
    codeErreur: varchar("code_erreur", { length: 50 }),
    sourcesReussies: jsonb("sources_reussies"),
    sourcesEchouees: jsonb("sources_echouees"),
    dateEnrichissement: timestamp("date_enrichissement", { mode: "string" }).defaultNow().notNull(),
    dureeMs: integer("duree_ms"),
    sourceUtilisation: varchar("source_utilisation", { length: 20 }),
    integrateur: varchar({ length: 255 }),
    versionApi: varchar("version_api", { length: 20 }),
    centroidLatitude: numeric("centroid_latitude", { precision: 10, scale: 7 }),
    centroidLongitude: numeric("centroid_longitude", { precision: 10, scale: 7 }),
    geometrie: jsonb(),
  },
  (table) => [
    index("idx_logs_enrichissement_centroid").using(
      "btree",
      table.centroidLatitude.asc().nullsLast().op("numeric_ops"),
      table.centroidLongitude.asc().nullsLast().op("numeric_ops"),
    ),
    index("idx_logs_enrichissement_date").using(
      "btree",
      table.dateEnrichissement.asc().nullsLast().op("timestamp_ops"),
    ),
    index("idx_logs_enrichissement_identifiant").using(
      "btree",
      table.identifiantCadastral.asc().nullsLast().op("text_ops"),
    ),
    index("idx_logs_enrichissement_statut").using(
      "btree",
      table.statut.asc().nullsLast().op("text_ops"),
    ),
  ],
);
