CREATE TABLE "raw_icu" (
	"id" serial PRIMARY KEY NOT NULL,
	"code_giris" varchar(20) NOT NULL,
	"iuhi" double precision NOT NULL,
	"imported_at" timestamp DEFAULT now() NOT NULL,
	"geom" geometry(MultiPolygon, 4326)
);
--> statement-breakpoint
CREATE INDEX "raw_icu_code_giris_idx" ON "raw_icu" USING btree ("code_giris");--> statement-breakpoint
CREATE INDEX "raw_icu_geom_idx" ON "raw_icu" USING gist ("geom");
