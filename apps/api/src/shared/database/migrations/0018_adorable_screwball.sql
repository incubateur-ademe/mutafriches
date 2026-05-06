CREATE TABLE "raw_ite_fret" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(500) NOT NULL,
	"code_insee" varchar(5),
	"commune" varchar(255),
	"departement" varchar(3),
	"region" varchar(100),
	"gestionnaire" varchar(500),
	"etat" varchar(20),
	"longitude" double precision NOT NULL,
	"latitude" double precision NOT NULL
);
--> statement-breakpoint
CREATE INDEX "raw_ite_fret_code_insee_idx" ON "raw_ite_fret" USING btree ("code_insee");--> statement-breakpoint
CREATE INDEX "raw_ite_fret_spatial_idx" ON "raw_ite_fret" USING gist (ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326));