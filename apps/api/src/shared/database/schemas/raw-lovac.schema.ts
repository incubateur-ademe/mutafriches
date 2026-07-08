import { pgTable, varchar, integer, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Table raw_lovac : référentiel des logements vacants du parc privé par commune.
 *
 * Source : data.gouv.fr LOVAC (Cerema), mise à jour annuelle, importée en local
 * via `pnpm db:lovac:import`. Remplace l'appel live à l'API tabulaire data.gouv.fr,
 * rate-limitée sous charge réelle (cf ADR).
 */
export const rawLovac = pgTable(
  "raw_lovac",
  {
    /** Code INSEE de la commune (clé naturelle) */
    codeInsee: varchar("code_insee", { length: 5 }).primaryKey(),

    /** Nom de la commune (pour le fallback de recherche par nom) */
    nom: varchar("nom", { length: 255 }),

    /** Logements totaux du parc privé (null = secrétisé ou indisponible) */
    nombreLogementsTotal: integer("nombre_logements_total"),

    /** Logements vacants du parc privé (null = secrétisé ou indisponible) */
    nombreLogementsVacants: integer("nombre_logements_vacants"),

    /** Logements vacants depuis plus de 2 ans (null = secrétisé ou indisponible) */
    nombreLogementsVacantsPlus2ans: integer("nombre_logements_vacants_plus_2ans"),

    /** Millésime des données de vacance retenu à l'import */
    millesime: integer("millesime").notNull(),

    /** Date d'import dans la base */
    importedAt: timestamp("imported_at").defaultNow().notNull(),
  },
  (table) => [index("idx_raw_lovac_nom").on(table.nom)],
);

export type RawLovac = typeof rawLovac.$inferSelect;
export type NewRawLovac = typeof rawLovac.$inferInsert;
