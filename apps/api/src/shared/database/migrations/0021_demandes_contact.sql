-- Ajouter la valeur demande_contact_multisites à type_evenement_enum si absente
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'demande_contact_multisites'
        AND enumtypid = 'type_evenement_enum'::regtype
    ) THEN
        ALTER TYPE "public"."type_evenement_enum" ADD VALUE 'demande_contact_multisites';
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."besoin_multisites_enum" AS ENUM('suivi_comparaison', 'integration_outils');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "demandes_contact" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"besoin" "besoin_multisites_enum" NOT NULL,
	"evaluation_id" varchar(50),
	"session_id" varchar(100),
	"integrateur" varchar(255),
	"mail_confirmation_envoye" boolean DEFAULT false NOT NULL,
	"date_creation" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_demandes_contact_date" ON "demandes_contact" USING btree ("date_creation");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_demandes_contact_besoin" ON "demandes_contact" USING btree ("besoin");
