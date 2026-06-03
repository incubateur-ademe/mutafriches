-- Migration initiale

-- Enable PostGIS extension (must be first)
CREATE EXTENSION IF NOT EXISTS postgis;


-- Table evaluations : forme d'origine (avant 0012/0014/0015), altérée par les migrations suivantes.
-- Recréée ici en IF NOT EXISTS pour les bases vierges. Inerte sur les bases existantes
-- (migrate est basé sur le timestamp du journal : 0000 ne se rejoue jamais une fois 0020 appliqué).
CREATE TABLE IF NOT EXISTS "evaluations" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"parcelle_id" varchar(20) NOT NULL,
	"code_insee" varchar(5) NOT NULL,
	"date_calcul" timestamp DEFAULT now() NOT NULL,
	"donnees_enrichissement" jsonb NOT NULL,
	"donnees_complementaires" jsonb NOT NULL,
	"resultats" jsonb NOT NULL,
	"fiabilite" numeric NOT NULL,
	"version_algorithme" varchar(20) NOT NULL,
	"source_utilisation" varchar(20) NOT NULL,
	"integrateur" varchar(255),
	"utilisateur_id" varchar(50),
	"commentaire" varchar(1000)
);

CREATE TABLE IF NOT EXISTS "evenements_utilisateur" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"type_evenement" varchar(50) NOT NULL,
	"evaluation_id" varchar(50),
	"identifiant_cadastral" varchar(20),
	"donnees" jsonb,
	"date_creation" timestamp DEFAULT now() NOT NULL,
	"source_utilisation" varchar(20),
	"integrateur" varchar(255),
	"user_agent" varchar(500),
	"session_id" varchar(100)
);

CREATE TABLE IF NOT EXISTS "logs_enrichissement" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"identifiant_cadastral" varchar(20) NOT NULL,
	"code_insee" varchar(5),
	"commune" varchar(255),
	"statut" varchar(20) NOT NULL,
	"donnees" jsonb,
	"message_erreur" varchar(1000),
	"code_erreur" varchar(50),
	"sources_reussies" jsonb,
	"sources_echouees" jsonb,
	"date_enrichissement" timestamp DEFAULT now() NOT NULL,
	"duree_ms" integer,
	"source_utilisation" varchar(20),
	"integrateur" varchar(255),
	"version_api" varchar(20)
);

CREATE INDEX IF NOT EXISTS "idx_type_evenement" ON "evenements_utilisateur" ("type_evenement");
CREATE INDEX IF NOT EXISTS "idx_evaluation_id" ON "evenements_utilisateur" ("evaluation_id");
CREATE INDEX IF NOT EXISTS "idx_date_creation" ON "evenements_utilisateur" ("date_creation");
CREATE INDEX IF NOT EXISTS "idx_logs_enrichissement_identifiant" ON "logs_enrichissement" ("identifiant_cadastral");
CREATE INDEX IF NOT EXISTS "idx_logs_enrichissement_statut" ON "logs_enrichissement" ("statut");
CREATE INDEX IF NOT EXISTS "idx_logs_enrichissement_date" ON "logs_enrichissement" ("date_enrichissement");