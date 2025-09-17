import { UsageType } from "../../enums";
import { DetailCalculUsage } from "./detail-calcul-output.dto";

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
 * Évaluation de la fiabilité du calcul
 */
export interface Fiabilite {
  note: number; // 0-10
  text: string; // "Très fiable", "Fiable", etc.
  description: string; // Description détaillée
  criteresRenseignes?: number; // Nombre de critères avec données
  criteresTotal?: number; // Nombre total de critères
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
