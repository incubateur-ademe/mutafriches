CREATE TABLE "raw_zonage_abc" (
	"code_insee" varchar(5) PRIMARY KEY NOT NULL,
	"nom" varchar(255),
	"departement" varchar(3),
	"zonage" varchar(4) NOT NULL,
	"millesime" varchar(100),
	"imported_at" timestamp DEFAULT now() NOT NULL
);
