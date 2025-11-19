-- Migration: Ajout des nouveaux événements de tracking

-- Ajouter les nouvelles valeurs à l'enum existant
ALTER TYPE "public"."type_evenement_enum" ADD VALUE IF NOT EXISTS 'visite';
ALTER TYPE "public"."type_evenement_enum" ADD VALUE IF NOT EXISTS 'enrichissement_termine';
ALTER TYPE "public"."type_evenement_enum" ADD VALUE IF NOT EXISTS 'donnees_complementaires_saisies';
ALTER TYPE "public"."type_evenement_enum" ADD VALUE IF NOT EXISTS 'evaluation_terminee';

-- Ajouter la colonne ref
ALTER TABLE "evenements_utilisateur" ADD COLUMN IF NOT EXISTS "ref" varchar(100);