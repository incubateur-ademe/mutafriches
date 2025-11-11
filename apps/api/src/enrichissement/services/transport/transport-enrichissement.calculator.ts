/**
 * Calculateur pour les règles métier du domaine Transport
 */
export class TransportCalculator {
  /**
   * Détermine si une parcelle est en centre-ville
   *
   * Règle métier : distance à la mairie < 1000m
   *
   * @param distanceMetres - Distance entre parcelle et mairie en mètres
   * @returns true si en centre-ville
   */
  static isCentreVille(distanceMetres: number): boolean {
    const SEUIL_CENTRE_VILLE_M = 1000;
    return distanceMetres < SEUIL_CENTRE_VILLE_M;
  }
}
