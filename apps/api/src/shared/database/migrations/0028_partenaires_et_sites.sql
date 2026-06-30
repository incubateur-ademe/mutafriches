CREATE TABLE "partenaire_sites" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"partenaire_slug" varchar(50) NOT NULL,
	"idtup" varchar(50) NOT NULL,
	"parcelles" jsonb NOT NULL,
	"commune" varchar(255) NOT NULL,
	"code_insee" varchar(5),
	"nom" varchar(255),
	"nom_defaut" varchar(255),
	"origine" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" varchar(100),
	CONSTRAINT "uq_partenaire_sites_slug_idtup" UNIQUE("partenaire_slug","idtup")
);
--> statement-breakpoint
CREATE TABLE "partenaires" (
	"slug" varchar(50) PRIMARY KEY NOT NULL,
	"nom" varchar(255) NOT NULL,
	"description" varchar(1000) NOT NULL,
	"departement" varchar(3) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "partenaire_sites" ADD CONSTRAINT "partenaire_sites_partenaire_slug_partenaires_slug_fk" FOREIGN KEY ("partenaire_slug") REFERENCES "public"."partenaires"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_partenaire_sites_slug" ON "partenaire_sites" USING btree ("partenaire_slug");