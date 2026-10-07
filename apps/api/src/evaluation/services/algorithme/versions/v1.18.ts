/**
 * Version 1.18 - v1.17 + zone d'activité économique.
 *
 * Nouveau critère enrichi `siteEnZae` (poids 1) : le centroïde du site est-il dans un site
 * d'activité de type « zone d'activité économique » de la base Fusac (Cerema, millésime 2025) ?
 * En ZAE : résidentiel négatif, locaux d'activité positif, industrie très positif, autres usages
 * neutres. Hors ZAE : neutre sur les sept usages.
 *
 * 32 critères, poids total 34. Règles d'exclusion inchangées.
 *
 * Source : arbitrage de l'équipe produit du 2026-10-07 (règle algo, pas de fichier Excel de
 * référence). Donnée : https://datafoncier.cerema.fr/fusac (ADR-0049).
 *
 * Re-export de la configuration courante.
 */
export { POIDS_CRITERES, MATRICE_SCORING, REGLES_EXCLUSION } from "../algorithme.config";
