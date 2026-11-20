CREATE TABLE "integrateurs" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"canal" varchar(20) NOT NULL,
	"structure" varchar(255) NOT NULL,
	"type_structure" varchar(30) NOT NULL,
	"origine" varchar(255),
	"cle_stats" varchar(255),
	"statut" varchar(20) NOT NULL,
	"departement" varchar(3),
	"nb_sites_estime" varchar(20),
	"contact_enregistre" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"active_le" timestamp,
	CONSTRAINT "uq_integrateurs_canal_origine" UNIQUE("canal","origine"),
	CONSTRAINT "uq_integrateurs_cle_stats" UNIQUE("cle_stats")
);
--> statement-breakpoint
CREATE INDEX "idx_integrateurs_statut" ON "integrateurs" USING btree ("statut");