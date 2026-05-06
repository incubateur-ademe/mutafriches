DROP INDEX IF EXISTS "raw_ite_fret_code_insee_idx";--> statement-breakpoint
ALTER TABLE "raw_ite_fret" DROP COLUMN IF EXISTS "code_insee";--> statement-breakpoint
ALTER TABLE "raw_ite_fret" DROP COLUMN IF EXISTS "departement";--> statement-breakpoint
ALTER TABLE "raw_ite_fret" DROP COLUMN IF EXISTS "region";--> statement-breakpoint
ALTER TABLE "raw_ite_fret" ADD COLUMN "adresse" varchar(500);--> statement-breakpoint
ALTER TABLE "raw_ite_fret" ADD COLUMN "code_postal" varchar(50);--> statement-breakpoint
ALTER TABLE "raw_ite_fret" ADD COLUMN "code_siret" varchar(50);--> statement-breakpoint
CREATE INDEX "raw_ite_fret_code_postal_idx" ON "raw_ite_fret" USING btree ("code_postal");
