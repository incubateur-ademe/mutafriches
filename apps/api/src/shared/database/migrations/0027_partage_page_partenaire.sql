-- Ajoute la valeur 'partage_page_partenaire' à type_evenement_enum si absente (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'partage_page_partenaire'
        AND enumtypid = 'type_evenement_enum'::regtype
    ) THEN
        ALTER TYPE "public"."type_evenement_enum" ADD VALUE 'partage_page_partenaire';
    END IF;
END $$;
