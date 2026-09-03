import { pgTable, serial, varchar, doublePrecision, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Table raw_icu : indicateurs d'îlot de chaleur urbain (ICU) par zone d'étude.
 *
 * Source : CSTB — « Cartographie nationale des indicateurs liés à l'îlot de chaleur urbain »
 * (projet SCO Sat4BDNB), importée en local via `pnpm db:icu:import`.
 * https://www.data.gouv.fr/datasets/cartographie-nationale-des-indicateurs-lies-a-lilot-de-chaleur-urbain
 *
 * Couverture partielle et non communale : 1 955 zones (mailles IRIS groupées) sur ~600
 * communes seulement. L'appartenance se teste donc spatialement, jamais par code INSEE.
 *
 * Note : la colonne geom (geometry(MultiPolygon, 4326)) et son index GIST sont ajoutés
 * via la migration SQL — Drizzle ne type pas les colonnes PostGIS (cf. raw_bpe).
 */
export const rawIcu = pgTable(
  "raw_icu",
  {
    id: serial("id").primaryKey(),

    /** Identifiant de la zone d'étude (code IRIS groupé du dataset source) */
    codeGiris: varchar("code_giris", { length: 20 }).notNull(),

    /** Intensité maximale absolue de l'îlot de chaleur urbain, en degrés Celsius */
    iuhi: doublePrecision("iuhi").notNull(),

    /** Date d'import dans la base */
    importedAt: timestamp("imported_at").defaultNow().notNull(),
  },
  (table) => ({
    codeGirisIdx: index("raw_icu_code_giris_idx").on(table.codeGiris),
  }),
);

export type RawIcu = typeof rawIcu.$inferSelect;
export type NewRawIcu = typeof rawIcu.$inferInsert;
