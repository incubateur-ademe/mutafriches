-- Migration initiale
-- On crée uniquement les nouvelles tables

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