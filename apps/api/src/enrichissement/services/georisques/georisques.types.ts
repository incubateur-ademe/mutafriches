/**
 * Types pour le sous-domaine georisques
 */

import { GeoRisquesResult } from "../../adapters/georisques/georisques.types";

/**
 * Résultat de l'orchestration GeoRisques
 */
export interface ResultatOrchestrationGeoRisques {
  data: GeoRisquesResult | undefined;
  sourcesUtilisees: string[];
  sourcesEchouees: string[];
}
