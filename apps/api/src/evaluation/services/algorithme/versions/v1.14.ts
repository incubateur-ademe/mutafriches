/**
 * Version 1.14 - v1.13 + quartier prioritaire de la politique de la ville.
 *
 * Nouveau critère enrichi `siteEnQpv` (poids 1) : 29 → 30 critères, poids total 31 → 32.
 * Booléen alimenté par un test spatial du centroïde du site contre les 1 584 périmètres QPV
 * du millésime 2024 (ANCT), importés en table locale — la Géoplateforme ne sert que la
 * géographie 2015, abrogée (ADR-0037).
 *
 * En QPV, la reconversion sert directement les politiques de renouvellement urbain : très
 * positif pour le résidentiel et les équipements publics, qui sont l'objet même du
 * dispositif. Très négatif pour le tertiaire, dont l'implantation en quartier prioritaire est
 * peu soutenue par le marché, et négatif pour le photovoltaïque au sol, qui consommerait du
 * foncier rare en tissu urbain dense. Neutre pour la culture, l'industrie et la renaturation.
 *
 * Hors QPV, le critère est neutre sur les sept usages. Attention : NEUTRE n'est pas sans
 * effet — le score 0,5 est ajouté aux avantages ET aux contraintes, ce qui rapproche de 50 %
 * l'indice de tous les sites hors QPV, soit la quasi-totalité du parc.
 *
 * Source : ANCT — Quartiers prioritaires de la politique de la ville, millésime 2024,
 * https://www.data.gouv.fr/datasets/quartiers-prioritaires-de-la-politique-de-la-ville-qpv
 *
 * Re-export de la configuration courante.
 */
export { POIDS_CRITERES, MATRICE_SCORING } from "../algorithme.config";
