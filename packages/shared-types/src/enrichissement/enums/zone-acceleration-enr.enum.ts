/**
 * Critère algorithmique dérivé des données ZAER
 * (Zones d'Accélération des Énergies Renouvelables)
 */
export enum ZoneAccelerationEnr {
  /** Le site n'est dans aucune zone ZAER */
  NON = "non",
  /** Le site est dans une zone ZAER (hors PV ombrière) */
  OUI = "oui",
  /** Le site est dans une zone ZAER avec PV ombrière (détail filière contenant "OMBRIERE") */
  OUI_SOLAIRE_PV_OMBRIERE = "oui-solaire-pv-ombriere",
}
