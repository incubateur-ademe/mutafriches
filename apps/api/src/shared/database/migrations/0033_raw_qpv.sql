CREATE TABLE "raw_qpv" (
	"id" serial PRIMARY KEY NOT NULL,
	"code_qpv" varchar(20) NOT NULL,
	"nom_qpv" varchar(255) NOT NULL,
	"code_insee" varchar(100) NOT NULL,
	"imported_at" timestamp DEFAULT now() NOT NULL,
	"geom" geometry(MultiPolygon, 4326)
);
--> statement-breakpoint
CREATE INDEX "raw_qpv_code_qpv_idx" ON "raw_qpv" USING btree ("code_qpv");--> statement-breakpoint
CREATE INDEX "raw_qpv_geom_idx" ON "raw_qpv" USING gist ("geom");
