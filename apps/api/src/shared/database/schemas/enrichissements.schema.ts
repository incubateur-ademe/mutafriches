import { pgTable, varchar, jsonb, timestamp, integer, numeric, index } from "drizzle-orm/pg-core";

export const enrichissements = pgTable(
  "enrichissements",
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
    centroidLatitude: numeric("centroid_latitude", { precision: 10, scale: 7 }),
    centroidLongitude: numeric("centroid_longitude", { precision: 10, scale: 7 }),
    geometrie: jsonb("geometrie"),
  },
  (table) => [
    index("idx_enrichissements_identifiant").on(table.identifiantCadastral),
    index("idx_enrichissements_statut").on(table.statut),
    index("idx_enrichissements_date").on(table.dateEnrichissement),
    index("idx_enrichissements_centroid").on(table.centroidLatitude, table.centroidLongitude),
  ],
);
