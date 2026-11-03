CREATE TABLE "attributaire_sites" (
	"cle_site" varchar(1000) PRIMARY KEY NOT NULL,
	"identifiants_cadastraux" jsonb NOT NULL,
	"nombre_parcelles" integer NOT NULL,
	"parcelle_predominante" varchar(20),
	"code_insee" varchar(5) NOT NULL,
	"commune" varchar(255),
	"partenaire_slug" varchar(50),
	"partenaire_idtup" varchar(50),
	"nom" varchar(255),
	"centroid_latitude" numeric(10, 7),
	"centroid_longitude" numeric(10, 7),
	"geometrie" jsonb,
	"criteres_automatiques" jsonb NOT NULL,
	"date_enrichissement" timestamp NOT NULL,
	"criteres_saisis" jsonb,
	"date_saisie" timestamp,
	"evaluation_id" varchar(50),
	"nombre_evaluations" integer DEFAULT 0 NOT NULL,
	"mutabilite" jsonb NOT NULL,
	"fiabilite" numeric NOT NULL,
	"usage_prioritaire" varchar(20),
	"version_algorithme" varchar(20) NOT NULL,
	"date_mise_a_jour" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_attributaire_sites_code_insee" ON "attributaire_sites" USING btree ("code_insee");