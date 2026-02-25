ALTER TYPE "public"."type_evenement_enum" ADD VALUE 'parcelle_ajoutee' BEFORE 'interet_multi_parcelles';--> statement-breakpoint
ALTER TYPE "public"."type_evenement_enum" ADD VALUE 'parcelle_supprimee' BEFORE 'interet_multi_parcelles';--> statement-breakpoint
ALTER TYPE "public"."type_evenement_enum" ADD VALUE 'jauge_depassee' BEFORE 'interet_multi_parcelles';