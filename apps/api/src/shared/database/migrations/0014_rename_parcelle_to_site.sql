ALTER TABLE "evaluations" RENAME COLUMN "parcelle_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "evaluations" ALTER COLUMN "site_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "nombre_parcelles" integer;