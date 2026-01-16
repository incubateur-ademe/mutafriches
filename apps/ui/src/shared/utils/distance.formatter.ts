/**
 * Formate une distance en mètres pour un affichage lisible
 *
 * @param distanceMetres - Distance en mètres (ou undefined)
 * @returns Distance formatée avec espaces et unité, ou chaîne vide si non disponible
 *
 * @example
 * formatDistance(10000) // "10 000 m"
 * formatDistance(500) // "500 m"
 * formatDistance(undefined) // ""
 */
export function formatDistance(distanceMetres: number | undefined): string {
  if (distanceMetres === undefined || distanceMetres === null) {
    return "";
  }

  // Formater avec espaces pour les milliers
  const distanceFormatee = Math.round(distanceMetres).toLocaleString("fr-FR");

  return `${distanceFormatee} m`;
}

/**
 * Formate une surface en m² pour un affichage lisible
 *
 * @param surfaceM2 - Surface en m² (ou undefined)
 * @returns Surface formatée avec espaces et unité, ou chaîne vide si non disponible
 *
 * @example
 * formatSurface(42780) // "42 780 m²"
 * formatSurface(615) // "615 m²"
 * formatSurface(undefined) // ""
 */
export function formatSurface(surfaceM2: number | undefined): string {
  if (surfaceM2 === undefined || surfaceM2 === null) {
    return "";
  }

  const surfaceFormatee = Math.round(surfaceM2).toLocaleString("fr-FR");

  return `${surfaceFormatee} m²`;
}
