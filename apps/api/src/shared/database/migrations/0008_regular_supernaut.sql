-- Migration: Création table raw_transport_stops avec déduplication
-- Date: 2025-12-12
-- Description: Table pour stocker les arrêts de transport en France (transport.data.gouv.fr)
--              Avec contrainte UNIQUE sur les coordonnées pour éviter les doublons

-- Créer la table
CREATE TABLE "raw_transport_stops" (
	"id" serial PRIMARY KEY NOT NULL,
	"stop_name" varchar(500) NOT NULL,
	"stop_lat" double precision NOT NULL,
	"stop_lon" double precision NOT NULL,
	"location_type" varchar(10),
	-- Contrainte UNIQUE sur les coordonnées (évite les doublons)
	CONSTRAINT "raw_transport_stops_coords_unique" UNIQUE ("stop_lat", "stop_lon")
);

-- Index spatial PostGIS pour les recherches de proximité
CREATE INDEX "raw_transport_stops_spatial_idx" 
ON "raw_transport_stops" 
USING gist (ST_SetSRID(ST_MakePoint("stop_lon", "stop_lat"), 4326));

-- Index sur le type de localisation (pour filtrage éventuel)
CREATE INDEX "raw_transport_stops_location_type_idx" 
ON "raw_transport_stops" 
USING btree ("location_type");