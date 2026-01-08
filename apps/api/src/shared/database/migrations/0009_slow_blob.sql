CREATE TABLE "raw_ademe_sites_pollues" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom_site" varchar(500) NOT NULL,
	"code_insee" varchar(5) NOT NULL,
	"commune" varchar(255),
	"parcelles_cadastrales" text,
	"longitude" double precision NOT NULL,
	"latitude" double precision NOT NULL,
	"surface_site_m2" varchar(50),
	"typologie_intervention" varchar(500),
	"etat_operation" varchar(50),
	"region" varchar(100),
	"departement" varchar(3)
);
--> statement-breakpoint
CREATE INDEX "raw_ademe_sites_pollues_code_insee_idx" ON "raw_ademe_sites_pollues" USING btree ("code_insee");--> statement-breakpoint
CREATE INDEX "raw_ademe_sites_pollues_spatial_idx" ON "raw_ademe_sites_pollues" USING gist (ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326));