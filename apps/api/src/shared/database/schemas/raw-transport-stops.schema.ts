import { pgTable, varchar, doublePrecision, index, serial } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Table pour stocker les points d'arrêt de transport en France
 * Source: https://transport.data.gouv.fr/datasets/arrets-de-transport-en-france
 *
 * Champs stockés (sélection des champs les plus utiles):
 * - id: Identifiant unique auto-généré
 * - stop_name: Nom de l'arrêt
 * - stop_lat: Latitude (WGS84)
 * - stop_lon: Longitude (WGS84)
 * - location_type: Type d'arrêt selon GTFS
 *   * 0 ou vide: Arrêt ou quai
 *   * 1: Station (groupement d'arrêts)
 *   * 2: Entrée/sortie de station
 *   * 3: Nœud générique
 *   * 4: Zone d'embarquement
 *
 * Index spatial créé sur les coordonnées pour optimiser les recherches de proximité
 */
export const rawTransportStops = pgTable(
  "raw_transport_stops",
  {
    id: serial("id").primaryKey(),
    stopName: varchar("stop_name", { length: 500 }).notNull(),
    stopLat: doublePrecision("stop_lat").notNull(),
    stopLon: doublePrecision("stop_lon").notNull(),
    locationType: varchar("location_type", { length: 10 }),
  },
  (table) => ({
    // Index spatial PostGIS pour les recherches de proximité
    spatialIdx: index("raw_transport_stops_spatial_idx").using(
      "gist",
      sql`ST_SetSRID(ST_MakePoint(${table.stopLon}, ${table.stopLat}), 4326)`,
    ),
    // Index sur le type pour filtrer rapidement
    locationTypeIdx: index("raw_transport_stops_location_type_idx").on(table.locationType),
  }),
);

export type RawTransportStop = typeof rawTransportStops.$inferSelect;
export type RawTransportStopInsert = typeof rawTransportStops.$inferInsert;
