-- Créer l'enum mode_utilisation s'il n'existe pas
DO $$ BEGIN
    CREATE TYPE "public"."mode_utilisation_enum" AS ENUM('standalone', 'iframe');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ajouter les valeurs à type_evenement_enum seulement si elles n'existent pas
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'visite' 
        AND enumtypid = 'type_evenement_enum'::regtype
    ) THEN
        ALTER TYPE "public"."type_evenement_enum" ADD VALUE 'visite';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'enrichissement_termine' 
        AND enumtypid = 'type_evenement_enum'::regtype
    ) THEN
        ALTER TYPE "public"."type_evenement_enum" ADD VALUE 'enrichissement_termine';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'donnees_complementaires_saisies' 
        AND enumtypid = 'type_evenement_enum'::regtype
    ) THEN
        ALTER TYPE "public"."type_evenement_enum" ADD VALUE 'donnees_complementaires_saisies';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'evaluation_terminee' 
        AND enumtypid = 'type_evenement_enum'::regtype
    ) THEN
        ALTER TYPE "public"."type_evenement_enum" ADD VALUE 'evaluation_terminee';
    END IF;
END $$;

-- Ajouter la colonne mode_utilisation
ALTER TABLE "evenements_utilisateur" 
ADD COLUMN IF NOT EXISTS "mode_utilisation" "public"."mode_utilisation_enum";