import { pgTable, varchar, jsonb, timestamp, index, unique } from "drizzle-orm/pg-core";
import { partenaires } from "./partenaires.schema";

/**
 * Table partenaire_sites : sites (unités foncières) d'un partenaire.
 *
 * Ne porte que les données PARTAGÉES (identité + nom). La saisie « Connaissance terrain »
 * et la mutabilité restent en localStorage côté utilisateur (cf. ADR-0021).
 *
 * Source de vérité du nom : last-write-wins sur updated_at.
 */
export const partenaireSites = pgTable(
  "partenaire_sites",
  {
    /** Identifiant interne (uuid) */
    id: varchar("id", { length: 50 }).primaryKey(),

    /** Partenaire de rattachement */
    partenaireSlug: varchar("partenaire_slug", { length: 50 })
      .notNull()
      .references(() => partenaires.slug),

    /** Identifiant d'unité foncière stable (mono = id cadastral, multi = clé dérivée) */
    idtup: varchar("idtup", { length: 50 }).notNull(),

    /** Identifiants cadastraux des parcelles du site (string[]) */
    parcelles: jsonb("parcelles").notNull(),

    /** Commune prédominante */
    commune: varchar("commune", { length: 255 }).notNull(),

    /** Code INSEE de la commune */
    codeInsee: varchar("code_insee", { length: 5 }),

    /** Nom éditable. NULL => on affiche nom_defaut */
    nom: varchar("nom", { length: 255 }),

    /** Nom par défaut (rue la plus proche, BAN), calculé une fois à la création */
    nomDefaut: varchar("nom_defaut", { length: 255 }),

    /** Origine : "seed" (data initiale) ou "custom" (ajouté par un utilisateur) */
    origine: varchar("origine", { length: 20 }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),

    /** Dernier éditeur du nom (optionnel, anonyme) */
    updatedBy: varchar("updated_by", { length: 100 }),
  },
  (table) => [
    index("idx_partenaire_sites_slug").on(table.partenaireSlug),
    unique("uq_partenaire_sites_slug_idtup").on(table.partenaireSlug, table.idtup),
  ],
);

export type PartenaireSite = typeof partenaireSites.$inferSelect;
export type NewPartenaireSite = typeof partenaireSites.$inferInsert;
