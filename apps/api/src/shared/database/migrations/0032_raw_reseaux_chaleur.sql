CREATE TABLE "raw_reseaux_chaleur" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifiant_reseau" varchar(20),
	"nom" varchar(255),
	"gestionnaire" varchar(255),
	"trace_complet" boolean DEFAULT true NOT NULL,
	"imported_at" timestamp DEFAULT now() NOT NULL,
	"geom" geometry(Geometry, 4326)
);
--> statement-breakpoint
CREATE INDEX "raw_reseaux_chaleur_identifiant_idx" ON "raw_reseaux_chaleur" USING btree ("identifiant_reseau");--> statement-breakpoint
CREATE INDEX "raw_reseaux_chaleur_geom_idx" ON "raw_reseaux_chaleur" USING gist ("geom");--> statement-breakpoint
-- Index sur la projection geography : sans lui, ST_DWithin/ST_Distance en mètres ne peuvent
-- pas utiliser l'index GiST et la requête passe de ~60 ms à ~1,3 s.
CREATE INDEX "raw_reseaux_chaleur_geog_idx" ON "raw_reseaux_chaleur" USING gist ((geom::geography));
