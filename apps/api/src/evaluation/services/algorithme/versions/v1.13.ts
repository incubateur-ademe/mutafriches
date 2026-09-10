/**
 * Version 1.13 - v1.12 + distance au réseau de chaleur urbain.
 *
 * Nouveau critère enrichi `distanceReseauChaleur` (poids 1) : 28 → 29 critères, poids total
 * 30 → 31. La distance au réseau de chaleur le plus proche est classée sur un seuil unique de
 * 500 mètres — en mètres de bout en bout, sans conversion en km contrairement à l'autoroute et
 * au raccordement électrique (ADR-0027). Sous 500 m, le raccordement est un atout fort pour
 * les usages bâtis (résidentiel, équipements, culture) et un atout pour le tertiaire ; au-delà,
 * et pour l'industrie, la renaturation et le photovoltaïque, l'effet est neutre.
 *
 * Une distance indisponible (`null` : aucun réseau à proximité, ou réseau connu dont France
 * Chaleur Urbaine n'a pas le tracé) est ramenée à la tranche « >= 500 m » à la frontière de
 * l'algorithme, plutôt qu'ignorée : cf. ADR-0036.
 *
 * Source : API France Chaleur Urbaine (ministère de la Transition écologique),
 * https://www.data.gouv.fr/dataservices/api-france-chaleur-urbaine
 *
 * Re-export de la configuration courante.
 */
export { POIDS_CRITERES, MATRICE_SCORING } from "../algorithme.config";
