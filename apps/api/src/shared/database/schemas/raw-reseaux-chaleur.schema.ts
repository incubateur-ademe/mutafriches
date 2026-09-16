import { pgTable, serial, varchar, boolean, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Table raw_reseaux_chaleur : tracés des réseaux de chaleur et de froid urbains.
 *
 * Source : API France Chaleur Urbaine (ministère de la Transition écologique),
 * endpoint `GET /v1/networks`, importée via `pnpm db:reseaux-chaleur:import`.
 * https://www.data.gouv.fr/dataservices/api-france-chaleur-urbaine
 *
 * La distance au réseau est calculée en local (ST_Distance sur le tracé) plutôt que via
 * `GET /v1/eligibility` : cet endpoint mesure la distance sur une géométrie partielle pour
 * une partie des réseaux, avec des écarts allant jusqu'à plusieurs centaines de mètres
 * (cf. ADR-0037).
 *
 * 18 % des réseaux publiés n'ont pas de tracé : France Chaleur Urbaine ne fournit alors que
 * la position d'un point (chaufferie). La colonne `trace_complet` permet de les distinguer,
 * car la distance mesurée sur un point surestime la distance au réseau réel.
 *
 * Note : la colonne geom (geometry(Geometry, 4326) — lignes ET points) et son index GIST
 * sont ajoutés via la migration SQL : Drizzle ne type pas les colonnes PostGIS
 * (cf. raw_icu, raw_bpe).
 */
export const rawReseauxChaleur = pgTable(
  "raw_reseaux_chaleur",
  {
    id: serial("id").primaryKey(),

    /** Identifiant national du réseau (SNCU), ex. "4911C". Absent sur certains réseaux. */
    identifiantReseau: varchar("identifiant_reseau", { length: 20 }),

    /** Nom du réseau tel que publié par France Chaleur Urbaine */
    nom: varchar("nom", { length: 255 }),

    /** Exploitant du réseau */
    gestionnaire: varchar("gestionnaire", { length: 255 }),

    /** false = seule la position d'un point est publiée, le tracé est inconnu */
    traceComplet: boolean("trace_complet").notNull().default(true),

    /** Date d'import dans la base */
    importedAt: timestamp("imported_at").defaultNow().notNull(),
  },
  (table) => ({
    identifiantIdx: index("raw_reseaux_chaleur_identifiant_idx").on(table.identifiantReseau),
  }),
);

export type RawReseauChaleur = typeof rawReseauxChaleur.$inferSelect;
export type NewRawReseauChaleur = typeof rawReseauxChaleur.$inferInsert;
