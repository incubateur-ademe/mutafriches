CREATE TABLE "raw_zae" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_site" varchar(40) NOT NULL,
	"imported_at" timestamp DEFAULT now() NOT NULL,
	"geom" geometry(MultiPolygon, 4326)
);
--> statement-breakpoint
CREATE INDEX "raw_zae_id_site_idx" ON "raw_zae" USING btree ("id_site");--> statement-breakpoint
CREATE INDEX "raw_zae_geom_idx" ON "raw_zae" USING gist ("geom");
