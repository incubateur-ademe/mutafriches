import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

/**
 * Table raw_zonage_abc : zonage ABC (tension du marché du logement) par commune.
 *
 * Source : data.gouv.fr « Liste des communes selon le zonage ABC » (DGALN), mise à jour
 * à chaque arrêté (~1×/an), importée en local via `pnpm db:zonage-abc:import`.
 * Remplace l'appel live à l'API tabulaire data.gouv.fr, rate-limitée sous charge (ADR-0032).
 */
export const rawZonageAbc = pgTable("raw_zonage_abc", {
  /** Code INSEE de la commune (clé naturelle : gère Corse 2A/2B et DOM) */
  codeInsee: varchar("code_insee", { length: 5 }).primaryKey(),

  /** Nom de la commune */
  nom: varchar("nom", { length: 255 }),

  /** Code département (2 ou 3 caractères : 01, 2A, 971…) */
  departement: varchar("departement", { length: 3 }),

  /** Zone ABC normalisée : abis | a | b1 | b2 | c */
  zonage: varchar("zonage", { length: 4 }).notNull(),

  /**
   * Millésime du zonage, extrait du nom de colonne du CSV source
   * (ex. « Zonage ABC en vigueur depuis le 26 juin 2026 » → « 26 juin 2026 »).
   * Trace quelle version de l'arrêté est réellement en base.
   */
  millesime: varchar("millesime", { length: 100 }),

  /** Date d'import dans la base */
  importedAt: timestamp("imported_at").defaultNow().notNull(),
});

export type RawZonageAbc = typeof rawZonageAbc.$inferSelect;
export type NewRawZonageAbc = typeof rawZonageAbc.$inferInsert;
