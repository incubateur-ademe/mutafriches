import { UsageResultat, DetailCalculUsage } from "@mutafriches/shared-types";

/**
 * Type étendu pour les tests avec mode détaillé
 */
export interface UsageResultatDetaille extends UsageResultat {
  avantages?: number;
  contraintes?: number;
  detailsCalcul?: DetailCalculUsage;
}
