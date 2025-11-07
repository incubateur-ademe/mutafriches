import { Coordonnees, GeometrieParcelle } from "@mutafriches/shared-types";

/**
 * Extension du type GeometrieParcelle pour inclure Point
 * (nécessaire pour les requêtes API Carto qui acceptent aussi des points)
 */
export type ParcelleGeometry =
  | GeometrieParcelle
  | {
      type: "Point";
      coordinates: [number, number];
    };

/**
 * Alias pour la cohérence avec le reste du code
 */
export type Coordinates = Coordonnees;

/**
 * Convertit une géométrie en point (centroid approximatif)
 */
export function geometryToPoint(geometry: ParcelleGeometry): Coordinates | null {
  if (geometry.type === "Point") {
    const coords = geometry.coordinates as [number, number];
    return { longitude: coords[0], latitude: coords[1] };
  }

  // Pour Polygon/MultiPolygon, on pourrait calculer le centroid
  // Pour l'instant on retourne null
  return null;
}
