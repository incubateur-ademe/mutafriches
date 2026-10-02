/**
 * Version 1.16 - v1.15 + critères excluants.
 *
 * Poids et matrice inchangés (31 critères, poids total 33). Ajout de règles d'exclusion
 * binaires, évaluées après le scoring : quand toutes leurs conditions sont réunies, l'usage
 * est déclaré exclu. Son indice reste calculé et exposé (contrat API additif), mais il est
 * classé en fin de tableau et l'UI n'affiche plus de pourcentage (ADR-0048).
 *
 * - Zone d'exclusion des EnR (loi APER) : exclut le photovoltaïque au sol.
 * - Zone humide ET espèces protégées, toutes deux à « Oui » : excluent l'industrie et le
 *   tertiaire. « Ne sait pas » ne déclenche jamais d'exclusion.
 *
 * Source : arbitrage de l'équipe produit du 2026-10-01 (pas de fichier Excel de référence,
 * l'exclusion étant hors matrice).
 *
 * Re-export de la configuration courante.
 */
export { POIDS_CRITERES, MATRICE_SCORING, REGLES_EXCLUSION } from "../algorithme.config";
