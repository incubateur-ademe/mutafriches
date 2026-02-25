/**
 * Données d'entrée pour l'enrichissement d'un site (mono ou multi-parcelle)
 */
export interface EnrichirSiteInputDto {
  /**
   * Identifiant cadastral unique (rétro-compatible mono-parcelle)
   * Format: code département + code commune + préfixe section + numéro parcelle
   * Exemple: "25056000HZ0346"
   */
  identifiant?: string;

  /**
   * Identifiants cadastraux multiples (multi-parcelle)
   * Exemple: ["25056000HZ0346", "25056000HZ0347"]
   */
  identifiants?: string[];
}
