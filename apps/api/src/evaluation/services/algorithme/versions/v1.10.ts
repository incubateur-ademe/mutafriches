/**
 * Version 1.10 - v1.9 + correction de l'unité des distances (mètres → km).
 *
 * Matrice et poids strictement identiques à v1.9. Le changement porte sur la frontière de
 * l'algorithme : distanceAutoroute et distanceRaccordementElectrique, stockées en mètres par
 * l'enrichissement, sont désormais converties en km avant scoring (metresVersKm dans
 * extraireCriteres, cf. ADR-0027). Corrige le sous-scoring systématique de l'industrie et du
 * photovoltaïque sur le parcours d'enrichissement live.
 *
 * Ré-exporte le snapshot figé de v1.9, et non la configuration courante : celle-ci a divergé
 * à partir de v1.11 (réactivation de distanceIte).
 */
export { POIDS_CRITERES, MATRICE_SCORING } from "./v1.9";
