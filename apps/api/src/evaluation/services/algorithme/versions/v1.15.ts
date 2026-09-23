/**
 * Version 1.15 - v1.14 + saturation du réseau électrique pour les projets EnR.
 *
 * Nouveau critère enrichi `saturationReseauEnr` (poids 1) : 30 → 31 critères, poids total
 * 32 → 33. Booléen alimenté par un test spatial du centroïde du site contre la carte Enedis
 * des zones en contrainte pour raccorder de nouveaux projets de production HTA/BT, importée
 * en table locale (ADR-0046). Seul le statut « saturée » compte comme saturé : une zone
 * « en tension » reste raccordable.
 *
 * En zone saturée, un projet photovoltaïque ne peut pas être raccordé sans travaux préalables
 * lourds sur le réseau : très négatif pour le photovoltaïque, neutre pour les six autres
 * usages. Hors zone saturée, le critère est neutre sur les sept usages — NEUTRE n'est pas sans
 * effet, le score 0,5 alimentant avantages ET contraintes.
 *
 * Source : Enedis, en lien avec RTE — carte des zones de contrainte projets EnR,
 * https://openservices.enedis.fr/service/carte-zones-contrainte-projets-enr/
 *
 * Re-export de la configuration courante.
 */
export { POIDS_CRITERES, MATRICE_SCORING } from "../algorithme.config";
