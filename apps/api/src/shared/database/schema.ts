import { pgTable, varchar, jsonb, timestamp, numeric } from "drizzle-orm/pg-core";

// TODO: Ajouter des tables pour les utilisateurs, les parcelles, etc.

// Table pour les évaluations
export const evaluations = pgTable("evaluations", {
  id: varchar("id", { length: 50 }).primaryKey(),
  parcelleId: varchar("parcelle_id", { length: 20 }).notNull(),
  dateCalcul: timestamp("date_calcul").notNull().defaultNow(),

  // Snapshot des données au moment du calcul
  donneesEnrichissement: jsonb("donnees_enrichissement").notNull(),
  donneesComplementaires: jsonb("donnees_complementaires").notNull(),

  // Résultats
  resultats: jsonb("resultats").notNull(),
  fiabilite: numeric("fiabilite").notNull(),

  // Métadonnées
  versionAlgorithme: varchar("version_algorithme", { length: 20 }).notNull(),
  utilisateurId: varchar("utilisateur_id", { length: 50 }),
  commentaire: varchar("commentaire", { length: 1000 }),
});

// Export pour Drizzle
export const schema = {
  evaluations,
};
