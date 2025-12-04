import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  bigint,
  text,
  pgEnum,
} from "drizzle-orm/pg-core";

/**
 * Enum pour le statut des imports
 */
export const importStatusEnum = pgEnum("import_status", ["running", "success", "failed"]);

/**
 * Table raw_imports_log : suivi des imports de données brutes
 *
 * Permet de :
 * - Suivre l'historique des imports
 * - Monitorer via Metabase
 * - Diagnostiquer les erreurs
 */
export const rawImportsLog = pgTable("raw_imports_log", {
  id: serial("id").primaryKey(),

  /** Nom du dataset importé (ex: 'bpe', 'tvb_reservoirs', 'tvb_corridors') */
  datasetName: varchar("dataset_name", { length: 50 }).notNull(),

  /** Date de début de l'import */
  startedAt: timestamp("started_at").defaultNow().notNull(),

  /** Date de fin de l'import (null si en cours) */
  finishedAt: timestamp("finished_at"),

  /** Statut de l'import */
  status: importStatusEnum("status").default("running").notNull(),

  /** Nombre de lignes importées avec succès */
  rowsImported: integer("rows_imported").default(0).notNull(),

  /** Nombre de lignes filtrées/ignorées */
  rowsFiltered: integer("rows_filtered").default(0).notNull(),

  /** Nombre total de lignes dans le fichier source */
  rowsTotal: integer("rows_total").default(0).notNull(),

  /** Message d'erreur si échec */
  errorMessage: text("error_message"),

  /** URL ou chemin du fichier source */
  sourcePath: varchar("source_path", { length: 500 }),

  /** Taille du fichier source en bytes */
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),

  /** Version de l'algorithme d'import (pour traçabilité) */
  importVersion: varchar("import_version", { length: 20 }).default("1.0"),
});

export type RawImportsLog = typeof rawImportsLog.$inferSelect;
export type NewRawImportsLog = typeof rawImportsLog.$inferInsert;
