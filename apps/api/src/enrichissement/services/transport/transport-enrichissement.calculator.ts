import { SEUIL_CENTRE_VILLE_M } from "./transport-enrichissement.constants";

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
    return distanceMetres < SEUIL_CENTRE_VILLE_M;
  }

  /**
   * Catégorise la distance à l'autoroute/voie rapide la plus proche
   *
   * Règles métier (basées sur Excel Mutafriches) :
   * - < 1 km : "Moins de 1km"
   * - 1-2 km : "Entre 1 et 2km"
   * - 2-5 km : "Entre 2 et 5km"
   * - 5-10 km : "Entre 5 et 10km"
   * - > 10 km : "Plus de 10km"
   *
   * @param distanceMetres - Distance en mètres à la voie de grande circulation
   * @returns Catégorie de distance
   */
  static categoriserDistanceAutoroute(distanceMetres: number): string {
    if (distanceMetres < 1000) return "Moins de 1km";
    if (distanceMetres < 2000) return "Entre 1 et 2km";
    if (distanceMetres < 5000) return "Entre 2 et 5km";
    if (distanceMetres < 10000) return "Entre 5 et 10km";
    return "Plus de 10km";
  }
}
