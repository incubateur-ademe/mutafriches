import { pgTable, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { epci } from "./epci.schema";

/**
 * Table communes : référentiel des communes françaises avec leur rattachement EPCI
 *
 * Source : fichier DGCL « Composition communale des EPCI à fiscalité propre ».
 *
 * Permet de joindre les évaluations (via code_insee) à un EPCI pour les
 * statistiques agrégées.
 */
export const communes = pgTable(
  "communes",
  {
    /** Code INSEE de la commune (5 caractères, ex: 75056, 2A004) */
    codeInsee: varchar("code_insee", { length: 5 }).primaryKey(),

    /** Nom de la commune */
    nom: varchar("nom", { length: 255 }).notNull(),

    /** Code département (gère Corse 2A/2B et DOM-TOM 971+) */
    departement: varchar("departement", { length: 3 }),

    /**
     * SIREN de l'EPCI de rattachement.
     * Nullable car certaines communes (4 îles bretonnes notamment) ne sont
     * rattachées à aucun EPCI à fiscalité propre.
     */
    epciSiren: varchar("epci_siren", { length: 9 }).references(() => epci.siren),

    /** Date d'import dans la base */
    importedAt: timestamp("imported_at").defaultNow().notNull(),
  },
  (table) => [
    // Index pour les jointures stats (evaluations -> communes -> epci)
    index("idx_communes_epci_siren").on(table.epciSiren),
  ],
);

export type Commune = typeof communes.$inferSelect;
export type NewCommune = typeof communes.$inferInsert;
