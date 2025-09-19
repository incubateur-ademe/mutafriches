/**
 * Détail d'un critère dans le calcul de mutabilité
 */
export interface DetailCritere {
  critere: string; // Nom du critère
  valeur: string | number | boolean; // Valeur du critère
  scoreBrut: number; // Score avant pondération
  poids: number; // Coefficient de pondération
  scorePondere: number; // Score final (scoreBrut * poids)
}

/**
 * Détails du calcul pour un usage spécifique
 */
export interface DetailCalculUsage {
  detailsAvantages: DetailCritere[]; // Critères positifs
  detailsContraintes: DetailCritere[]; // Critères négatifs
  detailsCriteresVides: DetailCritere[]; // Critères non renseignés
  totalAvantages: number; // Somme des avantages
  totalContraintes: number; // Somme des contraintes
}
