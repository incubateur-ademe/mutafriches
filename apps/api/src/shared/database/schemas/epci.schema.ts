import { pgTable, varchar, integer, timestamp } from "drizzle-orm/pg-core";

/**
 * Table epci : référentiel des Établissements Publics de Coopération Intercommunale
 *
 * Source : fichier DGCL « Composition communale des EPCI à fiscalité propre »
 * (https://www.data.gouv.fr/fr/), mise à jour annuelle.
 *
 * Utilisé pour calculer des statistiques agrégées par EPCI (croisement avec
 * la table communes via communes.epci_siren).
 */
export const epci = pgTable("epci", {
  /** SIREN de l'EPCI (9 caractères) */
  siren: varchar("siren", { length: 9 }).primaryKey(),

  /** Nom complet de l'EPCI */
  nom: varchar("nom", { length: 255 }).notNull(),

  /**
   * Nature juridique de l'EPCI
   * CC = Communauté de Communes
   * CA = Communauté d'Agglomération
   * CU = Communauté Urbaine
   * ME = Métropole
   */
  natureJuridique: varchar("nature_juridique", { length: 10 }),

  /** Département du siège (gère Corse 2A/2B et DOM-TOM 971+) */
  departementSiege: varchar("departement_siege", { length: 3 }),

  /** Nombre de communes membres */
  nbCommunes: integer("nb_communes"),

  /** Population totale de l'EPCI */
  population: integer("population"),

  /** Date d'import dans la base */
  importedAt: timestamp("imported_at").defaultNow().notNull(),
});

export type Epci = typeof epci.$inferSelect;
export type NewEpci = typeof epci.$inferInsert;
