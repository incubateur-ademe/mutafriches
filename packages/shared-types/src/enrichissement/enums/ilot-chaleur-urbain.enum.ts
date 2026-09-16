/**
 * Exposition du site à un îlot de chaleur urbain (ICU).
 *
 * Source : CSTB — cartographie nationale des indicateurs liés à l'îlot de chaleur urbain.
 * Donnée strictement informative : elle n'entre pas dans le calcul de mutabilité et n'a
 * donc ni poids ni ligne dans la matrice de scoring (cf. ADR-0034).
 *
 * La cartographie ne couvre qu'environ 600 communes : d'où le troisième état, qui distingue
 * une commune étudiée d'une commune absente du périmètre. Dans une commune étudiée, un site
 * hors des zones cartographiées est réputé non concerné (ADR-0037).
 */
export enum IlotChaleurUrbain {
  /** Site dans une zone dont l'intensité ICU atteint ou dépasse le seuil de 5,5 °C */
  OUI = "oui",
  /** Zone cartographiée sous le seuil, ou commune étudiée sans zone à proximité du site */
  NON = "non",
  /** Commune absente du périmètre d'étude : aucune mesure disponible */
  NON_COUVERT = "non-couvert",
}
