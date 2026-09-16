CREATE TABLE "raw_reseaux_chaleur" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifiant_reseau" varchar(20),
	"nom" varchar(255),
	"gestionnaire" varchar(255),
	"imported_at" timestamp DEFAULT now() NOT NULL,
	"geom" geometry(MultiLineString, 4326)
);
--> statement-breakpoint
CREATE INDEX "raw_reseaux_chaleur_identifiant_idx" ON "raw_reseaux_chaleur" USING btree ("identifiant_reseau");--> statement-breakpoint
CREATE INDEX "raw_reseaux_chaleur_geom_idx" ON "raw_reseaux_chaleur" USING gist ("geom");
