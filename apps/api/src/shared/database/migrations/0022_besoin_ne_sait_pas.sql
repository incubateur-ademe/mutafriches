-- Ajoute la valeur 'ne-sait-pas' à besoin_multisites_enum si absente
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'ne-sait-pas'
        AND enumtypid = 'besoin_multisites_enum'::regtype
    ) THEN
        ALTER TYPE "public"."besoin_multisites_enum" ADD VALUE 'ne-sait-pas';
    END IF;
END $$;
