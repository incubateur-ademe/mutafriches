import { pgTable, serial, varchar, text, doublePrecision, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Table raw_ademe_sites_pollues : sites ayant fait l'objet d'une intervention ADEME
 *
 * Source: ADEME - Sites et Sols Pollues (Interventions de l'ADEME)
 * Ces sites sont des friches industrielles ayant necessite une intervention
 * de l'ADEME pour mise en securite environnementale.
 *
 * Utilisation: Determiner si une parcelle est situee sur ou a proximite
 * d'un site reference comme potentiellement pollue.
 */
export const rawAdemeSitesPollues = pgTable(
  "raw_ademe_sites_pollues",
  {
    id: serial("id").primaryKey(),

    /** Nom du site (ex: "ARDENITY", "ATLAS INNOVATION") */
    nomSite: varchar("nom_site", { length: 500 }).notNull(),

    /** Code commune INSEE (ex: "8190", "44075") */
    codeInsee: varchar("code_insee", { length: 5 }).notNull(),

    /** Nom de la commune */
    commune: varchar("commune", { length: 255 }),

    /** Numeros de parcelles cadastrales associees au site (ex: ["000AY34", "000AY37"]) */
    parcellesCadastrales: text("parcelles_cadastrales"),

    /** Longitude WGS84 */
    longitude: doublePrecision("longitude").notNull(),

    /** Latitude WGS84 */
    latitude: doublePrecision("latitude").notNull(),

    /** Surface du site en m2 (peut etre "non renseigne") */
    surfaceSiteM2: varchar("surface_site_m2", { length: 50 }),

    /** Typologie d'intervention ADEME */
    typologieIntervention: varchar("typologie_intervention", { length: 500 }),

    /** Etat de l'operation (Terminee, En cours) */
    etatOperation: varchar("etat_operation", { length: 50 }),

    /** Region */
    region: varchar("region", { length: 100 }),

    /** Departement (code) */
    departement: varchar("departement", { length: 3 }),
  },
  (table) => ({
    // Index sur le code INSEE pour recherche par commune
    codeInseeIdx: index("raw_ademe_sites_pollues_code_insee_idx").on(table.codeInsee),

    // Index spatial PostGIS pour les recherches de proximite
    spatialIdx: index("raw_ademe_sites_pollues_spatial_idx").using(
      "gist",
      sql`ST_SetSRID(ST_MakePoint(${table.longitude}, ${table.latitude}), 4326)`,
    ),
  }),
);

export type RawAdemeSitePollue = typeof rawAdemeSitesPollues.$inferSelect;
export type NewRawAdemeSitePollue = typeof rawAdemeSitesPollues.$inferInsert;
