import { pgTable, serial, varchar, doublePrecision, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Table raw_ite_fret : Installations Terminales Embranchées (ITE) du réseau ferré français
 *
 * Source : Cerema - Base ITE 3000
 * https://www.data.gouv.fr/datasets/base-de-donnees-des-installations-terminales-embranchees-fret-en-france-ite-3000
 *
 * Utilisation : Déterminer si une parcelle est située à proximité d'une ITE fret
 * et l'état de cette ITE (bon ou mauvais), pour évaluer son potentiel d'usage industriel.
 */
export const rawIteFret = pgTable(
  "raw_ite_fret",
  {
    id: serial("id").primaryKey(),

    /** Nom de l'ITE */
    nom: varchar("nom", { length: 500 }).notNull(),

    /** Code commune INSEE */
    codeInsee: varchar("code_insee", { length: 5 }),

    /** Nom de la commune */
    commune: varchar("commune", { length: 255 }),

    /** Département (code) */
    departement: varchar("departement", { length: 3 }),

    /** Région */
    region: varchar("region", { length: 100 }),

    /** Gestionnaire / Opérateur de l'ITE */
    gestionnaire: varchar("gestionnaire", { length: 500 }),

    /** État de l'ITE : "bon" ou "mauvais" (normalisé depuis les valeurs source) */
    etat: varchar("etat", { length: 20 }),

    /** Longitude WGS84 */
    longitude: doublePrecision("longitude").notNull(),

    /** Latitude WGS84 */
    latitude: doublePrecision("latitude").notNull(),
  },
  (table) => ({
    // Index sur le code INSEE pour recherche par commune
    codeInseeIdx: index("raw_ite_fret_code_insee_idx").on(table.codeInsee),

    // Index spatial PostGIS pour les recherches de proximité
    spatialIdx: index("raw_ite_fret_spatial_idx").using(
      "gist",
      sql`ST_SetSRID(ST_MakePoint(${table.longitude}, ${table.latitude}), 4326)`,
    ),
  }),
);

export type RawIteFret = typeof rawIteFret.$inferSelect;
export type NewRawIteFret = typeof rawIteFret.$inferInsert;
