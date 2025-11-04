/**
 * Données d'entrée pour l'enrichissement d'une parcelle
 */
export interface EnrichirParcelleInputDto {
  /**
   * Identifiant cadastral unique de la parcelle
   * Format: code département + code commune + préfixe section + numéro parcelle
   * Exemple: "25056000HZ0346"
   */
  identifiant: string;
}
