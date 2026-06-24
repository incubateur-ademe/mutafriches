-- Ajoute les valeurs 'ouverture_recap_site' et 'ouverture_detail_usage'
-- à type_evenement_enum si absentes (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'ouverture_recap_site'
        AND enumtypid = 'type_evenement_enum'::regtype
    ) THEN
        ALTER TYPE "public"."type_evenement_enum" ADD VALUE 'ouverture_recap_site';
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'ouverture_detail_usage'
        AND enumtypid = 'type_evenement_enum'::regtype
    ) THEN
        ALTER TYPE "public"."type_evenement_enum" ADD VALUE 'ouverture_detail_usage';
    END IF;
END $$;
