import { pgTable, varchar, jsonb, timestamp, integer, numeric, index } from "drizzle-orm/pg-core";

export const sites = pgTable(
  "sites",
  {
    id: varchar("id", { length: 50 }).primaryKey(),

    // Parcelles constituant le site
    identifiantsCadastraux: jsonb("identifiants_cadastraux").notNull(), // string[]
    nombreParcelles: integer("nombre_parcelles").notNull(),

    // Commune prédominante (celle avec le plus de surface cumulée)
    codeInsee: varchar("code_insee", { length: 5 }),
    commune: varchar("commune", { length: 255 }),

    // Parcelle prédominante (la plus grande en superficie)
    parcellePredominante: varchar("parcelle_predominante", { length: 20 }),

    // Données d'enrichissement
    statut: varchar("statut", { length: 20 }).notNull(),
    donnees: jsonb("donnees"),
    messageErreur: varchar("message_erreur", { length: 1000 }),
    codeErreur: varchar("code_erreur", { length: 50 }),
    sourcesReussies: jsonb("sources_reussies"),
    sourcesEchouees: jsonb("sources_echouees"),
    dateEnrichissement: timestamp("date_enrichissement").notNull().defaultNow(),
    dureeMs: integer("duree_ms"),
    sourceUtilisation: varchar("source_utilisation", { length: 20 }),
    integrateur: varchar("integrateur", { length: 255 }),
    versionApi: varchar("version_api", { length: 20 }),

    // Centroïde du site (calculé depuis l'union des géométries)
    centroidLatitude: numeric("centroid_latitude", { precision: 10, scale: 7 }),
    centroidLongitude: numeric("centroid_longitude", { precision: 10, scale: 7 }),

    // Géométrie du site (union de toutes les parcelles)
    geometrie: jsonb("geometrie"),

    // Cache : référence vers le site source si servi depuis le cache
    siteSourceId: varchar("site_source_id", { length: 50 }),
  },
  (table) => [
    index("idx_sites_statut").on(table.statut),
    index("idx_sites_date").on(table.dateEnrichissement),
    index("idx_sites_centroid").on(table.centroidLatitude, table.centroidLongitude),
  ],
);
