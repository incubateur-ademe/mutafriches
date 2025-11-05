/**
 * Types pour le sous-domaine georisques
 */

import { GeoRisquesResult } from "../external/georisques/georisques.types";

/**
 * Résultat de l'orchestration GeoRisques
 */
export interface ResultatOrchestrationGeoRisques {
  data: GeoRisquesResult | undefined;
  sourcesUtilisees: string[];
  sourcesEchouees: string[];
}
