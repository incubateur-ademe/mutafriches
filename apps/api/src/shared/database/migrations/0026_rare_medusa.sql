-- Remplacement de la demande de contact par un calendrier ZCal :
-- suppression du stockage des coordonnées (table) et de l'enum associé.
DROP TABLE "demandes_contact" CASCADE;--> statement-breakpoint
DROP TYPE "public"."besoin_multisites_enum";