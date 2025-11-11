// apps/ui/src/shared/utils/distance.formatter.ts

/**
 * Formate une distance en mètres pour un affichage lisible
 *
 * @param distanceMetres - Distance en mètres (ou undefined)
 * @param defaultValue - Valeur par défaut si undefined
 * @returns Distance formatée avec espaces et unité
 *
 * @example
 * formatDistance(10000) // "10 000 m"
 * formatDistance(500) // "500 m"
 * formatDistance(undefined) // "Donnée non accessible"
 * formatDistance(undefined, "NC") // "NC"
 */
export function formatDistance(
  distanceMetres: number | undefined,
  defaultValue: string = "Donnée non accessible",
): string {
  if (distanceMetres === undefined || distanceMetres === null) {
    return defaultValue;
  }

  // Formater avec espaces pour les milliers
  const distanceFormatee = Math.round(distanceMetres).toLocaleString("fr-FR");

  return `${distanceFormatee} m`;
}

/**
 * Formate une surface en m² pour un affichage lisible
 *
 * @param surfaceM2 - Surface en m² (ou undefined)
 * @param defaultValue - Valeur par défaut si undefined
 * @returns Surface formatée avec espaces et unité
 *
 * @example
 * formatSurface(42780) // "42 780 m²"
 * formatSurface(615) // "615 m²"
 */
export function formatSurface(
  surfaceM2: number | undefined,
  defaultValue: string = "Donnée non accessible",
): string {
  if (surfaceM2 === undefined || surfaceM2 === null) {
    return defaultValue;
  }

  const surfaceFormatee = Math.round(surfaceM2).toLocaleString("fr-FR");

  return `${surfaceFormatee} m²`;
}
