import { pgTable, serial, varchar, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Table raw_zones_contrainte_enr : zones de contrainte pour raccorder de nouveaux projets de
 * production EnR HTA/BT (Enedis, en lien avec RTE).
 *
 * Source : carte Enedis des zones en contrainte, importée en local via
 * `pnpm db:zones-contrainte-enr:import <fichier>`.
 * https://observatoire.enedis.fr/services/carte-zones-contrainte-projets-enr
 *
 * Une zone = territoire alimenté par un poste source (~2 300 en métropole). Le fichier source
 * est protégé contre les téléchargements automatisés : il est récupéré à la main, cf. ADR-0046.
 *
 * Note : la colonne geom (geometry(MultiPolygon, 4326)) et son index GIST sont ajoutés
 * via la migration SQL — Drizzle ne type pas les colonnes PostGIS (cf. raw_qpv).
 */
export const rawZonesContrainteEnr = pgTable(
  "raw_zones_contrainte_enr",
  {
    id: serial("id").primaryKey(),

    /** Identifiant de la zone dans la carte Enedis */
    idZone: varchar("id_zone", { length: 20 }).notNull(),

    /** Statut Enedis : TRES_FAVORABLE, FAVORABLE, EN_TENSION, SATUREE ou ELD */
    statut: varchar("statut", { length: 20 }).notNull(),

    /** Date d'import dans la base */
    importedAt: timestamp("imported_at").defaultNow().notNull(),
  },
  (table) => ({
    idZoneIdx: index("raw_zones_contrainte_enr_id_zone_idx").on(table.idZone),
  }),
);

export type RawZoneContrainteEnr = typeof rawZonesContrainteEnr.$inferSelect;
export type NewRawZoneContrainteEnr = typeof rawZonesContrainteEnr.$inferInsert;
