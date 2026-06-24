-- Identifiant visiteur anonyme persistant (mesure de récurrence cross-visite)
-- IF NOT EXISTS par sécurité : le snapshot Drizzle était désynchronisé (migrations 0021-0023 écrites à la main)
ALTER TABLE "evenements_utilisateur" ADD COLUMN IF NOT EXISTS "visitor_id" varchar(50);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_visitor_id" ON "evenements_utilisateur" USING btree ("visitor_id");
