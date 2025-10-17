ALTER TABLE "logs_enrichissement" RENAME TO "enrichissements";--> statement-breakpoint
DROP INDEX "idx_logs_enrichissement_identifiant";--> statement-breakpoint
DROP INDEX "idx_logs_enrichissement_statut";--> statement-breakpoint
DROP INDEX "idx_logs_enrichissement_date";--> statement-breakpoint
DROP INDEX "idx_logs_enrichissement_centroid";--> statement-breakpoint
CREATE INDEX "idx_enrichissements_identifiant" ON "enrichissements" USING btree ("identifiant_cadastral");--> statement-breakpoint
CREATE INDEX "idx_enrichissements_statut" ON "enrichissements" USING btree ("statut");--> statement-breakpoint
CREATE INDEX "idx_enrichissements_date" ON "enrichissements" USING btree ("date_enrichissement");--> statement-breakpoint
CREATE INDEX "idx_enrichissements_centroid" ON "enrichissements" USING btree ("centroid_latitude","centroid_longitude");