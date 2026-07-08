CREATE TABLE "raw_lovac" (
	"code_insee" varchar(5) PRIMARY KEY NOT NULL,
	"nom" varchar(255),
	"nombre_logements_total" integer,
	"nombre_logements_vacants" integer,
	"nombre_logements_vacants_plus_2ans" integer,
	"millesime" integer NOT NULL,
	"imported_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_raw_lovac_nom" ON "raw_lovac" USING btree ("nom");