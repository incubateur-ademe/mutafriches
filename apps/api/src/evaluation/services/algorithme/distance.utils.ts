/**
 * Conversion d'unité pour les critères de distance à la frontière de l'algorithme.
 *
 * L'enrichissement stocke les distances en MÈTRES (IGN WFS, Enedis), mais la matrice
 * de scoring les interprète en KILOMÈTRES (source de vérité : fichier Excel). La conversion
 * doit donc se faire au moment d'extraire les critères, sans toucher au DTO (qui reste en
 * mètres pour l'affichage) ni à la matrice.
 *
 * Préserve `null` et `undefined` : leur sémantique (recherche sans résultat vs donnée
 * indisponible) est significative pour le calcul de fiabilité et ne doit pas être altérée.
 */
export function metresVersKm<T extends number | null | undefined>(metres: T): T {
  return (typeof metres === "number" ? metres / 1000 : metres) as T;
}
