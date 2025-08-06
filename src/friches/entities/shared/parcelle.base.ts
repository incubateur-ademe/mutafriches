import { ParcelleAutoData } from './parcelle-auto.interface';
import { ParcelleManualData } from './parcelle-manual.interface';

/**
 * Interface complète représentant une parcelle avec toutes ses caractéristiques
 * Union des données automatiques et manuelles
 */
export interface ParcelleBase extends ParcelleAutoData, ParcelleManualData {
  /**
   * Identifiant de session pour lier avec les résultats de mutabilité
   * Utilisé pour tracer le processus d'analyse
   */
  sessionId?: string;
}

// Export des types pour faciliter l'usage
export type { ParcelleAutoData, ParcelleManualData };
