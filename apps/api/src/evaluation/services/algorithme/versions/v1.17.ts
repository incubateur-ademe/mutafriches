/**
 * Version 1.17 - v1.16 + rééquilibrage des locaux d'activité.
 *
 * L'usage `tertiaire` est renommé « Locaux d'activité » dans l'interface : il couvre désormais
 * l'artisanat, les cabinets et les petites activités, pas seulement les bureaux. Ces activités
 * s'implantent aussi hors des centres, notamment en territoire rural, et sur des parcelles
 * modestes.
 *
 * Trois critères changent pour cet usage :
 * - `siteEnCentreVille` : en centre-ville, positif devient neutre ; hors centre, négatif
 *   devient positif.
 * - `surfaceSite` : sous 1,5 ha, neutre devient positif ; à partir de 1,5 ha, négatif devient
 *   neutre.
 * - `proximiteCommercesServices` : sans commerces ni services proches, négatif devient neutre.
 *
 * Poids, autres critères et règles d'exclusion inchangés (31 critères, poids total 33).
 *
 * Source : arbitrage de l'équipe produit du 2026-10-02, suite aux retours utilisateurs.
 *
 * Re-export de la configuration courante.
 */
export { POIDS_CRITERES, MATRICE_SCORING, REGLES_EXCLUSION } from "../algorithme.config";
