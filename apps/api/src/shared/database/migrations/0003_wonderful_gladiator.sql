-- Créer l'enum s'il n'existe pas
DO $$ BEGIN
    CREATE TYPE "public"."type_evenement_enum" AS ENUM('feedback_pertinence_classement', 'interet_multi_parcelles', 'interet_mise_en_relation', 'interet_export_resultats');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Modifier le type de la colonne
ALTER TABLE "evenements_utilisateur" 
ALTER COLUMN "type_evenement" TYPE "public"."type_evenement_enum" 
USING "type_evenement"::"public"."type_evenement_enum";