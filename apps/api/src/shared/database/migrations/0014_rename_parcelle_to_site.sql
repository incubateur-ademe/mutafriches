CREATE TABLE "sites" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"identifiants_cadastraux" jsonb NOT NULL,
	"nombre_parcelles" integer NOT NULL,
	"code_insee" varchar(5),
	"commune" varchar(255),
	"parcelle_predominante" varchar(20),
	"statut" varchar(20) NOT NULL,
	"donnees" jsonb,
	"message_erreur" varchar(1000),
	"code_erreur" varchar(50),
	"sources_reussies" jsonb,
	"sources_echouees" jsonb,
	"date_enrichissement" timestamp DEFAULT now() NOT NULL,
	"duree_ms" integer,
	"source_utilisation" varchar(20),
	"integrateur" varchar(255),
	"version_api" varchar(20),
	"centroid_latitude" numeric(10, 7),
	"centroid_longitude" numeric(10, 7),
	"geometrie" jsonb,
	"site_source_id" varchar(50)
);
--> statement-breakpoint
CREATE INDEX "idx_sites_statut" ON "sites" USING btree ("statut");--> statement-breakpoint
CREATE INDEX "idx_sites_date" ON "sites" USING btree ("date_enrichissement");--> statement-breakpoint
CREATE INDEX "idx_sites_centroid" ON "sites" USING btree ("centroid_latitude","centroid_longitude");--> statement-breakpoint
ALTER TABLE "evaluations" RENAME COLUMN "parcelle_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "evaluations" ALTER COLUMN "site_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "nombre_parcelles" integer;