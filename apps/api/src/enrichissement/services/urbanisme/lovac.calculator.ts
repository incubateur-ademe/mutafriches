/**
 * Calculateur pour les règles métier du domaine LOVAC (Logements vacants)
 */
export class LovacCalculator {
  /**
   * Calcule le taux de logements vacants
   *
   * Règle métier : (nombre de logements vacants / nombre total de logements) * 100
   * Arrondi à 1 décimale
   *
   * @param nombreLogementsVacants - Nombre de logements vacants
   * @param nombreLogementsTotal - Nombre total de logements du parc privé
   * @returns Taux de vacance en pourcentage (1 décimale) ou null si calcul impossible
   */
  static calculerTauxVacance(
    nombreLogementsVacants: number | null,
    nombreLogementsTotal: number | null,
  ): number | null {
    // Vérifications
    if (
      nombreLogementsVacants === null ||
      nombreLogementsTotal === null ||
      nombreLogementsTotal === 0
    ) {
      return null;
    }

    // Calcul avec arrondi à 1 décimale
    const taux = (nombreLogementsVacants / nombreLogementsTotal) * 100;
    return Math.round(taux * 10) / 10;
  }

  /**
   * Vérifie si les données LOVAC sont exploitables (non secrétisées)
   *
   * @param nombreLogementsVacants - Nombre de logements vacants
   * @param nombreLogementsTotal - Nombre total de logements
   * @returns true si les données sont exploitables
   */
  static sontDonneesExploitables(
    nombreLogementsVacants: number | null,
    nombreLogementsTotal: number | null,
  ): boolean {
    return (
      nombreLogementsVacants !== null && nombreLogementsTotal !== null && nombreLogementsTotal > 0
    );
  }

  /**
   * Catégorise le taux de logements vacants selon les seuils du Cerema
   *
   * Règles métier (selon plan national de lutte contre la vacance) :
   * - < 5% : Vacance frictionnelle (faible)
   * - 5-7.5% : Vacance normale
   * - 7.5-10% : Vacance préoccupante
   * - > 10% : Vacance structurelle (forte)
   *
   * @param tauxVacance - Taux de vacance en pourcentage
   * @returns Catégorie de vacance
   */
  static categoriserTauxVacance(tauxVacance: number): string {
    if (tauxVacance < 5) return "Vacance frictionnelle";
    if (tauxVacance < 7.5) return "Vacance normale";
    if (tauxVacance < 10) return "Vacance préoccupante";
    return "Vacance structurelle";
  }
}
