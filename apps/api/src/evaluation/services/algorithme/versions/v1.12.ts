/**
 * Version 1.12 - v1.11 + zone d'exclusion des énergies renouvelables (loi APER).
 *
 * Le critère `zoneAccelerationEnr` gagne une quatrième valeur, `exclusion`, alimentée par le
 * champ `zonage` du WFS ZAER (« Interdiction ZAER (loi APER) toutes ENR sauf toiture »). Un
 * site en zone d'interdiction est très négatif pour l'usage photovoltaïque — seule la toiture
 * y reste possible — et neutre pour les six autres usages. Nombre de critères (28), poids du
 * critère (1) et poids total (30) inchangés.
 *
 * Re-export de la configuration courante.
 */
export { POIDS_CRITERES, MATRICE_SCORING } from "../algorithme.config";
