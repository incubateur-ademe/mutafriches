import { pgTable, varchar, doublePrecision, jsonb, timestamp } from "drizzle-orm/pg-core";

export interface GroupeBatimentCache {
  id: string;
  surface: number;
}

/**
 * Cache de la surface bâtie BDNB par parcelle (ADR-0052).
 *
 * La BDNB limite à 10 000 appels/mois par IP et ses données bougent peu : une parcelle déjà
 * interrogée n'est redemandée qu'après 30 jours. Ce n'est pas un référentiel importé (pas de `raw_`).
 */
export const cacheBdnbParcelles = pgTable("cache_bdnb_parcelles", {
  /** Identifiant cadastral sur 14 caractères (section complétée) */
  parcelleId: varchar("parcelle_id", { length: 14 }).primaryKey(),

  /** Somme des emprises au sol ; 0 = parcelle non bâtie (réponse valide, aussi mise en cache) */
  surfaceBati: doublePrecision("surface_bati").notNull(),

  /** Détail par groupe de bâtiments, pour dédoublonner les groupes à cheval sur plusieurs parcelles */
  groupes: jsonb("groupes").$type<GroupeBatimentCache[]>().notNull(),

  /** Date de la dernière réponse BDNB, base du TTL */
  dateRecuperation: timestamp("date_recuperation").defaultNow().notNull(),
});

export type CacheBdnbParcelle = typeof cacheBdnbParcelles.$inferSelect;
export type NewCacheBdnbParcelle = typeof cacheBdnbParcelles.$inferInsert;
