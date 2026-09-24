import { POIDS_CRITERES } from "./algorithme.config";

/**
 * Nombre de critères utilisés dans le calcul
 * Calculé automatiquement depuis POIDS_CRITERES
 */
export const NOMBRE_CRITERES_UTILISES = Object.keys(POIDS_CRITERES).length;

/**
 * Seuil de proximité d'un réseau de chaleur urbain, en mètres.
 *
 * Sert au scoring (matrice `distanceReseauChaleur`) et de valeur de repli quand la distance
 * est `null` : « aucune distance exploitable » est scoré comme « >= 500 m ».
 */
export const SEUIL_PROXIMITE_RESEAU_CHALEUR_M = 500;

/**
 * Distance de repli, en mètres, quand Enedis ne trouve aucune infrastructure dans ses rayons
 * de recherche (5 km). Le site tombe alors dans la tranche « au-delà de 5 km » de la matrice,
 * exactement comme le faisait l'ancienne distance sentinelle de 999 km — sans la faire
 * remonter jusqu'à l'affichage.
 */
export const DISTANCE_RACCORDEMENT_HORS_RAYON_M = 5000;

// Aucun accès autoroutier dans le rayon de recherche (50 km) : tranche « au-delà de 5 km » (ADR-0047)
export const DISTANCE_ACCES_AUTOROUTIER_HORS_RAYON_M = 50000;
