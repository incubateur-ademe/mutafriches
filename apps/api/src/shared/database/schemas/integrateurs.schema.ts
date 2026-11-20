import { pgTable, varchar, boolean, timestamp, index, unique } from "drizzle-orm/pg-core";
import type { CanalIntegrateur, StatutIntegrateur, TypeStructure } from "@mutafriches/shared-types";

/**
 * Registre des intégrateurs : qui a déclaré vouloir utiliser l'API, l'extension QGIS, une page
 * personnalisée ou l'iframe (ADR-0055). Source des origines autorisées par
 * `IntegrateurOriginGuard` et CORS pour les canaux `api` et `qgis`.
 *
 * Aucune donnée personnelle : le prénom, le nom et l'adresse e-mail du déclarant partent dans
 * l'outil d'e-mailing et ne sont jamais écrits ici.
 */
export const integrateurs = pgTable(
  "integrateurs",
  {
    /** Identifiant interne (uuid) */
    id: varchar("id", { length: 50 }).primaryKey(),

    canal: varchar("canal", { length: 20 }).$type<CanalIntegrateur>().notNull(),

    /** Nom de l'organisation, jamais d'une personne */
    structure: varchar("structure", { length: 255 }).notNull(),
    typeStructure: varchar("type_structure", { length: 30 }).$type<TypeStructure>().notNull(),

    /** Origine normalisée (`https://hôte`), envoyée dans l'en-tête Origin. NULL pour `page` */
    origine: varchar("origine", { length: 255 }),

    /**
     * Valeur écrite dans la colonne `integrateur` des tables d'usage : hôte (`api`),
     * `qgis:<hôte>`, `partenaire:<slug>` (`page`) ou identifiant `integrator` (`iframe`).
     * NULL tant qu'une page ou une iframe n'est pas publiée.
     */
    cleStats: varchar("cle_stats", { length: 255 }),

    statut: varchar("statut", { length: 20 }).$type<StatutIntegrateur>().notNull(),

    /** Faux si l'outil d'e-mailing n'a pas reçu le contact : déclarant non joignable */
    contactEnregistre: boolean("contact_enregistre").notNull().default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    /** Date d'activation ou de publication */
    activeLe: timestamp("active_le"),
  },
  (table) => [
    // Un domaine se déclare une fois par canal : plusieurs agents d'une même structure
    // partagent la ligne.
    unique("uq_integrateurs_canal_origine").on(table.canal, table.origine),
    unique("uq_integrateurs_cle_stats").on(table.cleStats),
    index("idx_integrateurs_statut").on(table.statut),
  ],
);

export type Integrateur = typeof integrateurs.$inferSelect;
export type NewIntegrateur = typeof integrateurs.$inferInsert;
