import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

/**
 * Table partenaires : métadonnées d'un partenaire (page multisite /partenaires/:slug).
 *
 * Remplace le registre statique UI (apps/ui/.../partners/<slug>/index.ts) — cf. ADR-0021.
 * Seedée via le script db:partenaires:seed depuis le registre de prefetch.
 */
export const partenaires = pgTable("partenaires", {
  /** Slug : segment d'URL et clé primaire (ex: "aura", "cci-92") */
  slug: varchar("slug", { length: 50 }).primaryKey(),

  /** Nom affiché (titre de page et carte du hub) */
  nom: varchar("nom", { length: 255 }).notNull(),

  /** Description courte (carte du hub) */
  description: varchar("description", { length: 1000 }).notNull(),

  /** Code département INSEE (gère Corse 2A/2B et DOM-TOM 971+) */
  departement: varchar("departement", { length: 3 }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Partenaire = typeof partenaires.$inferSelect;
export type NewPartenaire = typeof partenaires.$inferInsert;
