CREATE TABLE "raw_zones_contrainte_enr" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_zone" varchar(20) NOT NULL,
	"statut" varchar(20) NOT NULL,
	"imported_at" timestamp DEFAULT now() NOT NULL,
	"geom" geometry(MultiPolygon, 4326)
);
--> statement-breakpoint
CREATE INDEX "raw_zones_contrainte_enr_id_zone_idx" ON "raw_zones_contrainte_enr" USING btree ("id_zone");--> statement-breakpoint
CREATE INDEX "raw_zones_contrainte_enr_geom_idx" ON "raw_zones_contrainte_enr" USING gist ("geom");
