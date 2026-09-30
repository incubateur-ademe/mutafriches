// Plafond de l'API : evaluations.site_id (varchar 1000) stocke les identifiants joints par
// virgules, soit 66 parcelles au plus. La carte de l'UI garde sa propre limite (20).
export const MAX_PARCELLES_PAR_SITE_API = 60;

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
