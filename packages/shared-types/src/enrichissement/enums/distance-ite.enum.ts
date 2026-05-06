/**
 * Distance à une Installation Terminale Embranchée (ITE) fret
 *
 * Source : Cerema - Base ITE 3000
 * Critère pour évaluer la proximité d'un terminal de chargement industriel ferroviaire,
 * pondéré dans l'algorithme de mutabilité (notamment pour l'usage Industrie).
 */
export enum DistanceIte {
  /** ITE à moins d'1 km en bon état */
  MOINS_1KM_BON_ETAT = "moins-1km-bon-etat",
  /** ITE à moins d'1 km en mauvais état */
  MOINS_1KM_MAUVAIS_ETAT = "moins-1km-mauvais-etat",
  /** Aucune ITE à moins d'1 km */
  PLUS_1KM = "plus-1km",
}
