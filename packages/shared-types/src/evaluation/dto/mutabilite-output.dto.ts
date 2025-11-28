import { UsageType } from "../enums";

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

/**
 * Résultat pour un usage spécifique
 */
export interface UsageResultat {
  rang: number; // 1-7 (1 = meilleur usage)
  usage: UsageType; // Type d'usage évalué
  indiceMutabilite: number; // 0-100
  potentiel?: string; // "Favorable", "Modéré", etc.
  explication?: string; // Explication du score
}

/**
 * Type étendu pour le mode détaillé avec calculs intermédiaires
 * Utilisé principalement dans les tests et le mode debug
 */
export interface UsageResultatDetaille extends UsageResultat {
  avantages?: number;
  contraintes?: number;
  detailsCalcul?: DetailCalculUsage;
}

/**
 * Détail d'un critère pour le calcul de fiabilité
 */
export interface DetailCritereFiabilite {
  critere: string; // Nom du critère
  poids: number; // Coefficient de pondération
  renseigne: boolean; // true si le critère a une valeur
}

/**
 * Évaluation de la fiabilité du calcul
 */
export interface Fiabilite {
  note: number; // 0-10
  text: string; // "Très fiable", "Fiable", etc.
  description: string; // Description détaillée
  criteresRenseignes: number; // Nombre de critères avec données
  criteresTotal: number; // Nombre total de critères
  poidsRenseignes: number; // Somme des poids des critères renseignés
  poidsTotal: number; // Somme totale des poids
  detailCriteres?: DetailCritereFiabilite[]; // Détail par critère (optionnel)
}

/**
 * Résultat complet du calcul de mutabilité
 */
export interface MutabiliteOutputDto {
  // Fiabilité globale du calcul
  fiabilite: Fiabilite;

  // Résultats pour les 7 usages, triés par potentiel décroissant
  resultats: UsageResultat[];

  // ID de l'évaluation sauvegardée (optionnel)
  evaluationId?: string;
}
