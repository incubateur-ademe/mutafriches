-- Migration: Ajout des colonnes géographiques pour le centroid
-- Date: 2025-01-16
-- Description: Ajoute centroid_latitude, centroid_longitude et geometrie à logs_enrichissement

ALTER TABLE "logs_enrichissement" 
ADD COLUMN IF NOT EXISTS "centroid_latitude" numeric(10, 7),
ADD COLUMN IF NOT EXISTS "centroid_longitude" numeric(10, 7),
ADD COLUMN IF NOT EXISTS "geometrie" jsonb;

CREATE INDEX IF NOT EXISTS "idx_logs_enrichissement_centroid" 
ON "logs_enrichissement" ("centroid_latitude", "centroid_longitude");

COMMENT ON COLUMN "logs_enrichissement"."centroid_latitude" IS 'Latitude du centre géométrique de la parcelle (WGS84)';
COMMENT ON COLUMN "logs_enrichissement"."centroid_longitude" IS 'Longitude du centre géométrique de la parcelle (WGS84)';
COMMENT ON COLUMN "logs_enrichissement"."geometrie" IS 'Géométrie complète de la parcelle (GeoJSON Polygon/MultiPolygon)';