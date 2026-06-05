-- Ajoute la valeur 'ouverture_modale_multisites' à type_evenement_enum si absente
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'ouverture_modale_multisites'
        AND enumtypid = 'type_evenement_enum'::regtype
    ) THEN
        ALTER TYPE "public"."type_evenement_enum" ADD VALUE 'ouverture_modale_multisites';
    END IF;
END $$;
