/**
 * Calcule la distance entre deux points GPS (formule de Haversine)
 * @returns Distance en mètres
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convertit des coordonnées WGS84 (lat/lon) en EPSG:3857 (Web Mercator)
 * Utilisé pour les requêtes spatiales qui nécessitent des coordonnées métriques
 *
 * @param lon - Longitude WGS84
 * @param lat - Latitude WGS84
 * @returns Coordonnées x,y en EPSG:3857 (mètres)
 */
export function convertWgs84ToEpsg3857(lon: number, lat: number): { x: number; y: number } {
  const R = 6378137; // Rayon de la Terre en mètres (Web Mercator)

  const x = ((lon * Math.PI) / 180) * R;
  const latRad = (lat * Math.PI) / 180;
  const y = Math.log(Math.tan(Math.PI / 4 + latRad / 2)) * R;

  return { x, y };
}

/**
 * Calcule la distance d'un point à un segment de droite (géodésique)
 *
 * @param px - Longitude du point
 * @param py - Latitude du point
 * @param x1 - Longitude du premier point du segment
 * @param y1 - Latitude du premier point du segment
 * @param x2 - Longitude du second point du segment
 * @param y2 - Latitude du second point du segment
 * @returns Distance en mètres
 */
export function distancePointToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;

  // Si le segment est un point
  if (dx === 0 && dy === 0) {
    return calculateDistance(py, px, y1, x1);
  }

  // Projection du point sur la droite du segment (paramètre t)
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));

  // Point projeté sur le segment
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  // Distance Haversine entre le point et sa projection
  return calculateDistance(py, px, projY, projX);
}
