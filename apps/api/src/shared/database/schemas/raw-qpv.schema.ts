import { pgTable, serial, varchar, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Table raw_qpv : périmètres des quartiers prioritaires de la politique de la ville (QPV).
 *
 * Source : ANCT — « Quartiers prioritaires de la politique de la ville », millésime 2024,
 * importée en local via `pnpm db:qpv:import`.
 * https://www.data.gouv.fr/datasets/quartiers-prioritaires-de-la-politique-de-la-ville-qpv
 *
 * 1 584 quartiers sur 834 communes seulement, et les périmètres sont infra-communaux : ils ne
 * couvrent que 3,8 % de la surface des communes concernées. L'appartenance se teste donc
 * spatialement sur le centroïde du site, jamais par code INSEE (cf. ADR-0039).
 *
 * Note : la colonne geom (geometry(MultiPolygon, 4326)) et son index GIST sont ajoutés
 * via la migration SQL — Drizzle ne type pas les colonnes PostGIS (cf. raw_icu).
 */
export const rawQpv = pgTable(
  "raw_qpv",
  {
    id: serial("id").primaryKey(),

    /** Code officiel du quartier au référencement 2024 (format QN00101M) */
    codeQpv: varchar("code_qpv", { length: 20 }).notNull(),

    /** Libellé du quartier */
    nomQpv: varchar("nom_qpv", { length: 255 }).notNull(),

    /** Commune(s) de rattachement, séparées par des virgules — 149 QPV sont à cheval */
    codeInsee: varchar("code_insee", { length: 100 }).notNull(),

    /** Date d'import dans la base */
    importedAt: timestamp("imported_at").defaultNow().notNull(),
  },
  (table) => ({
    codeQpvIdx: index("raw_qpv_code_qpv_idx").on(table.codeQpv),
  }),
);

export type RawQpv = typeof rawQpv.$inferSelect;
export type NewRawQpv = typeof rawQpv.$inferInsert;
