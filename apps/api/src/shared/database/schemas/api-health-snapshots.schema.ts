import { pgTable, serial, timestamp, jsonb } from "drizzle-orm/pg-core";

/**
 * Table api_health_snapshots : historique des health-checks des APIs externes.
 *
 * Une ligne par cycle de check (déclenché par le workflow GitHub Actions
 * `api-monitoring.yml` ou par un appel manuel à l'endpoint refresh).
 *
 * Permet à la page « Données externes » d'afficher rapidement le dernier
 * snapshot sans pinger les APIs distantes à chaque chargement.
 */
export const apiHealthSnapshots = pgTable("api_health_snapshots", {
  id: serial("id").primaryKey(),

  /** Date d'exécution du cycle de check (= début du cycle) */
  checkedAt: timestamp("checked_at").defaultNow().notNull(),

  /**
   * Snapshot complet sérialisé (type `ApiMonitoringSnapshot` côté shared-types).
   * Contient les résultats par API + le summary { up, slow, down }.
   */
  data: jsonb("data").notNull(),
});

export type ApiHealthSnapshotRow = typeof apiHealthSnapshots.$inferSelect;
export type NewApiHealthSnapshotRow = typeof apiHealthSnapshots.$inferInsert;
