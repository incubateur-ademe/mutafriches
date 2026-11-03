import { pgTable, varchar, jsonb, timestamp, integer, numeric, index } from "drizzle-orm/pg-core";
import type { CriteresSaisis, MutabiliteAttributaire } from "@mutafriches/shared-types";

/**
 * Table attributaire : une ligne par site évalué ou d'inventaire partenaire (ADR-0053).
 *
 * Projection recalculable depuis `evaluations`, `sites`, `enrichissements` et
 * `partenaire_sites` (`pnpm attributaire:peupler`) : ce n'est pas un référentiel importé.
 */
export const attributaireSites = pgTable(
  "attributaire_sites",
  {
    /** Parcelles normalisées, triées et jointes par des virgules */
    cleSite: varchar("cle_site", { length: 1000 }).primaryKey(),

    identifiantsCadastraux: jsonb("identifiants_cadastraux").$type<string[]>().notNull(),
    nombreParcelles: integer("nombre_parcelles").notNull(),
    parcellePredominante: varchar("parcelle_predominante", { length: 20 }),

    /** Commune prédominante issue de l'enrichissement */
    codeInsee: varchar("code_insee", { length: 5 }).notNull(),
    commune: varchar("commune", { length: 255 }),

    /** Renseignés quand l'ensemble de parcelles est celui d'un site partenaire */
    partenaireSlug: varchar("partenaire_slug", { length: 50 }),
    partenaireIdtup: varchar("partenaire_idtup", { length: 50 }),
    nom: varchar("nom", { length: 255 }),

    centroidLatitude: numeric("centroid_latitude", { precision: 10, scale: 7 }),
    centroidLongitude: numeric("centroid_longitude", { precision: 10, scale: 7 }),
    geometrie: jsonb("geometrie"),

    criteresAutomatiques: jsonb("criteres_automatiques").$type<Record<string, unknown>>().notNull(),
    dateEnrichissement: timestamp("date_enrichissement").notNull(),

    /** NULL : jamais qualifié, la mutabilité est calculée avec « ne sait pas » partout */
    criteresSaisis: jsonb("criteres_saisis").$type<CriteresSaisis>(),
    dateSaisie: timestamp("date_saisie"),
    /** Dernière évaluation retenue (interne, jamais exposée) */
    evaluationId: varchar("evaluation_id", { length: 50 }),
    nombreEvaluations: integer("nombre_evaluations").notNull().default(0),

    mutabilite: jsonb("mutabilite").$type<MutabiliteAttributaire>().notNull(),
    fiabilite: numeric("fiabilite").notNull(),
    usagePrioritaire: varchar("usage_prioritaire", { length: 20 }),
    versionAlgorithme: varchar("version_algorithme", { length: 20 }).notNull(),

    dateMiseAJour: timestamp("date_mise_a_jour").defaultNow().notNull(),
  },
  (table) => [index("idx_attributaire_sites_code_insee").on(table.codeInsee)],
);

export type AttributaireSite = typeof attributaireSites.$inferSelect;
export type NewAttributaireSite = typeof attributaireSites.$inferInsert;
