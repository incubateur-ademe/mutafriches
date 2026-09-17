-- Ajoute la valeur 'export_sites_partenaire' à type_evenement_enum si absente (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'export_sites_partenaire'
        AND enumtypid = 'type_evenement_enum'::regtype
    ) THEN
        ALTER TYPE "public"."type_evenement_enum" ADD VALUE 'export_sites_partenaire';
    END IF;
END $$;
