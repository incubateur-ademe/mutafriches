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
