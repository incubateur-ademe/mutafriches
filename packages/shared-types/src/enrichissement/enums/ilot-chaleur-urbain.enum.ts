/**
 * Exposition du site à un îlot de chaleur urbain (ICU).
 *
 * Source : CSTB — cartographie nationale des indicateurs liés à l'îlot de chaleur urbain.
 * Donnée strictement informative : elle n'entre pas dans le calcul de mutabilité et n'a
 * donc ni poids ni ligne dans la matrice de scoring (cf. ADR-0034).
 *
 * La cartographie ne couvre que ~600 communes : d'où le troisième état, qui distingue
 * « mesuré en dessous du seuil » de « jamais mesuré ». Les confondre laisserait croire
 * qu'un site hors périmètre a été évalué et déclaré non concerné.
 */
export enum IlotChaleurUrbain {
  /** Site dans une zone dont l'intensité ICU atteint ou dépasse le seuil de 5,5 °C */
  OUI = "oui",
  /** Site dans une zone cartographiée, sous le seuil de 5,5 °C */
  NON = "non",
  /** Site hors du périmètre d'étude : aucune mesure disponible */
  NON_COUVERT = "non-couvert",
}
