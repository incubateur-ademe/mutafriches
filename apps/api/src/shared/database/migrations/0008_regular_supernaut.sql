CREATE TABLE "raw_transport_stops" (
	"id" serial PRIMARY KEY NOT NULL,
	"stop_name" varchar(500) NOT NULL,
	"stop_lat" double precision NOT NULL,
	"stop_lon" double precision NOT NULL,
	"location_type" varchar(10)
);
--> statement-breakpoint
CREATE INDEX "raw_transport_stops_spatial_idx" ON "raw_transport_stops" USING gist (ST_SetSRID(ST_MakePoint("stop_lon", "stop_lat"), 4326));--> statement-breakpoint
CREATE INDEX "raw_transport_stops_location_type_idx" ON "raw_transport_stops" USING btree ("location_type");