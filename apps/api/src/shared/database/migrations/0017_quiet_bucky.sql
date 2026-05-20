CREATE TABLE "communes" (
	"code_insee" varchar(5) PRIMARY KEY NOT NULL,
	"nom" varchar(255) NOT NULL,
	"departement" varchar(3),
	"epci_siren" varchar(9),
	"imported_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "epci" (
	"siren" varchar(9) PRIMARY KEY NOT NULL,
	"nom" varchar(255) NOT NULL,
	"nature_juridique" varchar(10),
	"departement_siege" varchar(3),
	"nb_communes" integer,
	"population" integer,
	"imported_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "communes" ADD CONSTRAINT "communes_epci_siren_epci_siren_fk" FOREIGN KEY ("epci_siren") REFERENCES "public"."epci"("siren") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_communes_epci_siren" ON "communes" USING btree ("epci_siren");