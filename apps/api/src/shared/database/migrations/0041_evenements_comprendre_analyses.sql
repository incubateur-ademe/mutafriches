-- Ajoute les événements de la page « Comprendre les analyses » à type_evenement_enum si absents (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'consultation_comprendre_analyses'
        AND enumtypid = 'type_evenement_enum'::regtype
    ) THEN
        ALTER TYPE "public"."type_evenement_enum" ADD VALUE 'consultation_comprendre_analyses';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'consultation_onglet_comprendre_analyses'
        AND enumtypid = 'type_evenement_enum'::regtype
    ) THEN
        ALTER TYPE "public"."type_evenement_enum" ADD VALUE 'consultation_onglet_comprendre_analyses';
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'clic_lien_source_critere'
        AND enumtypid = 'type_evenement_enum'::regtype
    ) THEN
        ALTER TYPE "public"."type_evenement_enum" ADD VALUE 'clic_lien_source_critere';
    END IF;
END $$;
