/**
 * Version 1.19 - v1.18 + locaux d'activité très positifs en zone d'activité économique.
 *
 * Seul changement : pour le critère `siteEnZae`, l'usage `tertiaire` (« Locaux d'activité »)
 * passe de positif à très positif en zone d'activité économique. Le wording du critère ayant
 * changé, la règle est alignée sur l'industrie. Résidentiel négatif, industrie très positif,
 * autres usages neutres ; hors zone, neutre sur les sept usages.
 *
 * 32 critères, poids total 34. Poids, autres scores et règles d'exclusion inchangés.
 *
 * Source : arbitrage de l'équipe produit du 2026-10-07 (règle algo, pas de fichier Excel de
 * référence). Donnée : https://datafoncier.cerema.fr/fusac (ADR-0049).
 *
 * Re-export de la configuration courante.
 */
export { POIDS_CRITERES, MATRICE_SCORING, REGLES_EXCLUSION } from "../algorithme.config";
