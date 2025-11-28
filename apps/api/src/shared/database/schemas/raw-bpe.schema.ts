import { pgTable, serial, varchar, decimal, integer, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Table raw_bpe : données brutes des équipements BPE géolocalisés
 *
 * Source: INSEE BPE (Base Permanente des Équipements)
 * Contient uniquement les équipements pertinents pour Mutafriches :
 * - Transports en commun (gares)
 * - Commerces et services de proximité
 *
 * Note: La colonne geom (geometry PostGIS) est ajoutée via migration SQL
 * car Drizzle ne supporte pas nativement PostGIS
 */
export const rawBpe = pgTable(
  "raw_bpe",
  {
    id: serial("id").primaryKey(),

    /** Code type équipement (ex: E107, B207, A203) */
    codeEquipement: varchar("code_equipement", { length: 10 }).notNull(),

    /** Code commune INSEE (ex: 49007, 75056) */
    codeCommune: varchar("code_commune", { length: 5 }).notNull(),

    /** Longitude WGS84 */
    longitude: decimal("longitude", { precision: 15, scale: 12 }).notNull(),

    /** Latitude WGS84 */
    latitude: decimal("latitude", { precision: 15, scale: 12 }).notNull(),

    /**
     * Qualité de la géolocalisation
     * A = Bonne (coordonnées issues d'une base de données géolocalisées)
     * B = Acceptable (géocodage à l'adresse)
     * M = Manuelle ou approximative
     */
    qualiteXy: varchar("qualite_xy", { length: 1 }),

    /** Année de référence des données (ex: 2024) */
    anneeSource: integer("annee_source").notNull(),

    /** Date d'import dans la base */
    importedAt: timestamp("imported_at").defaultNow().notNull(),
  },
  (table) => [
    // Index sur le code équipement pour filtrer par type
    index("idx_raw_bpe_code_equipement").on(table.codeEquipement),
    // Index sur la commune pour les requêtes par zone
    index("idx_raw_bpe_code_commune").on(table.codeCommune),
    // Note: L'index spatial GIST sur geom est créé via migration SQL
  ],
);

export type RawBpe = typeof rawBpe.$inferSelect;
export type NewRawBpe = typeof rawBpe.$inferInsert;
