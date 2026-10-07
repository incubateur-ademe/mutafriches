import { pgTable, serial, varchar, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Table raw_zae : sites d'activité de type « zone d'activité économique » (Cerema, Fusac).
 *
 * Source : Fusac 2025, couche SITE-ECO, importée en local via `pnpm db:zae:import` (GeoJSON
 * commité, préparé par `pnpm data:zae:preparer`).
 * https://datafoncier.cerema.fr/fusac
 *
 * ~45 000 sites en métropole. Ce n'est pas un zonage réglementaire : plus de la moitié viennent
 * d'OpenStreetMap, le reste de zones d'urbanisme à vocation économique. L'appartenance se teste
 * sur le centroïde du site, cf. ADR-0049.
 *
 * Note : la colonne geom (geometry(MultiPolygon, 4326)) et son index GIST sont ajoutés
 * via la migration SQL — Drizzle ne type pas les colonnes PostGIS (cf. raw_qpv).
 */
export const rawZae = pgTable(
  "raw_zae",
  {
    id: serial("id").primaryKey(),

    /** Identifiant Fusac du site (format 01405_SITE-ECO_0176761) */
    idSite: varchar("id_site", { length: 40 }).notNull(),

    /** Date d'import dans la base */
    importedAt: timestamp("imported_at").defaultNow().notNull(),
  },
  (table) => ({
    idSiteIdx: index("raw_zae_id_site_idx").on(table.idSite),
  }),
);

export type RawZae = typeof rawZae.$inferSelect;
export type NewRawZae = typeof rawZae.$inferInsert;
