/**
 * Représentation d'un polygone GeoJSON
 */
interface PolygonGeometry {
  type: "Polygon";
  coordinates: number[][][];
}

/**
 * Crée un buffer carré autour d'un point en coordonnées WGS84
 *
 * @param lng - Longitude du point central
 * @param lat - Latitude du point central
 * @param meters - Rayon du buffer en mètres (par défaut 5m)
 * @returns Géométrie de type Polygon GeoJSON
 */
export function squareBufferLngLat(lng: number, lat: number, meters = 5): PolygonGeometry {
  // Conversions approximatives degrés <-> mètres (WGS84)
  // ~1° latitude ≈ 110.54 km
  const dLat = meters / 110_540;

  // Correction par latitude pour la longitude
  // ~1° longitude ≈ 111.32 km * cos(latitude)
  const dLng = meters / (111_320 * Math.cos((lat * Math.PI) / 180));

  const minLng = lng - dLng;
  const maxLng = lng + dLng;
  const minLat = lat - dLat;
  const maxLat = lat + dLat;

  // Polygon fermé (premier point = dernier point)
  const coordinates = [
    [
      [minLng, minLat],
      [minLng, maxLat],
      [maxLng, maxLat],
      [maxLng, minLat],
      [minLng, minLat],
    ],
  ];

  return {
    type: "Polygon",
    coordinates,
  };
}

/**
 * Extrait l'IDU complet d'une parcelle
 *
 * @param properties - Propriétés de la parcelle
 * @returns IDU formaté ou chaîne vide
 */
export function extractIdu(properties: Record<string, unknown>): string {
  const p = properties as {
    idu?: string;
    id?: string;
    code_dep?: string;
    code_com?: string;
    section?: string;
    numero?: string;
  };

  return (
    p.idu || p.id || `${p.code_dep || ""}${p.code_com || ""}${p.section || ""}${p.numero || ""}`
  );
}
