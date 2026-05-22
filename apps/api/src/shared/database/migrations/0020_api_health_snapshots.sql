CREATE TABLE "api_health_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"checked_at" timestamp DEFAULT now() NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX "api_health_snapshots_checked_at_idx" ON "api_health_snapshots" USING btree ("checked_at" DESC);
