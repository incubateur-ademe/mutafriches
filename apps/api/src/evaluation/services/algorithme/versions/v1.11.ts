/**
 * Version 1.11 - v1.10 + réactivation du critère « distance à une ITE fret » (distanceIte).
 *
 * Le critère, présent en v1.8 puis retiré en v1.9 en attente de validation Cerema, est
 * réintroduit : 27 → 28 critères, poids total 29.5 → 30. La distance à l'installation
 * terminale embranchée la plus proche est classée selon le seuil de 1 km croisé avec l'état
 * de l'embranchement (< 1 km bon état, < 1 km mauvais état, > 1 km) et valorise l'usage
 * industriel. Source : référentiel local ITE 3000 (Cerema), table `raw_ite_fret`.
 *
 * Re-export de la configuration courante.
 */
export { POIDS_CRITERES, MATRICE_SCORING } from "../algorithme.config";
