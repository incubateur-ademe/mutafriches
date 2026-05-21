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

    /** Nom de l'ITE (raison sociale de l'opérateur) */
    nom: varchar("nom", { length: 500 }).notNull(),

    /** Adresse complète (ex: "00 RHODIA PI BELLE ETOILE AVENUE ALBERT RAMBOZ") */
    adresse: varchar("adresse", { length: 500 }),

    /** Code postal (théoriquement 5 chars en France, mais dataset contient des valeurs sales) */
    codePostal: varchar("code_postal", { length: 50 }),

    /** Nom de la commune */
    commune: varchar("commune", { length: 255 }),

    /** Code SIRET (14 chiffres en théorie, mais dataset contient des valeurs sales) */
    codeSiret: varchar("code_siret", { length: 50 }),

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
    // Index sur le code postal pour recherche par commune
    codePostalIdx: index("raw_ite_fret_code_postal_idx").on(table.codePostal),

    // Index spatial PostGIS pour les recherches de proximité
    spatialIdx: index("raw_ite_fret_spatial_idx").using(
      "gist",
      sql`ST_SetSRID(ST_MakePoint(${table.longitude}, ${table.latitude}), 4326)`,
    ),
  }),
);

export type RawIteFret = typeof rawIteFret.$inferSelect;
export type NewRawIteFret = typeof rawIteFret.$inferInsert;
