CREATE TYPE "import_status" AS ENUM ('running', 'success', 'failed');
--> statement-breakpoint
CREATE TABLE "raw_bpe" (
	"id" serial PRIMARY KEY NOT NULL,
	"code_equipement" varchar(10) NOT NULL,
	"code_commune" varchar(5) NOT NULL,
	"longitude" numeric(15, 12) NOT NULL,
	"latitude" numeric(15, 12) NOT NULL,
	"qualite_xy" varchar(1),
	"annee_source" integer NOT NULL,
	"imported_at" timestamp DEFAULT now() NOT NULL,
	"geom" geometry(Point, 4326)
);
--> statement-breakpoint
CREATE TABLE "raw_imports_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"dataset_name" varchar(50) NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"status" "import_status" DEFAULT 'running' NOT NULL,
	"rows_imported" integer DEFAULT 0 NOT NULL,
	"rows_filtered" integer DEFAULT 0 NOT NULL,
	"rows_total" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"source_path" varchar(500),
	"file_size_bytes" bigint,
	"import_version" varchar(20) DEFAULT '1.0'
);
--> statement-breakpoint
CREATE INDEX "idx_raw_bpe_code_equipement" ON "raw_bpe" USING btree ("code_equipement");
--> statement-breakpoint
CREATE INDEX "idx_raw_bpe_code_commune" ON "raw_bpe" USING btree ("code_commune");
--> statement-breakpoint
CREATE INDEX "idx_raw_bpe_geom" ON "raw_bpe" USING gist ("geom");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION update_raw_bpe_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude::float, NEW.latitude::float), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER trigger_raw_bpe_geom
    BEFORE INSERT OR UPDATE ON raw_bpe
    FOR EACH ROW
    EXECUTE FUNCTION update_raw_bpe_geom();