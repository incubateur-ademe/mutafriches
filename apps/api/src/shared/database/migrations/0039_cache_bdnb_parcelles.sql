CREATE TABLE "cache_bdnb_parcelles" (
	"parcelle_id" varchar(14) PRIMARY KEY NOT NULL,
	"surface_bati" double precision NOT NULL,
	"groupes" jsonb NOT NULL,
	"date_recuperation" timestamp DEFAULT now() NOT NULL
);
