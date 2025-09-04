/**
 * Types d'usage possibles pour une parcelle
 */
export enum UsageType {
  RESIDENTIEL = "residentiel",
  EQUIPEMENTS = "equipements",
  CULTURE = "culture",
  TERTIAIRE = "tertiaire",
  INDUSTRIE = "industrie",
  RENATURATION = "renaturation",
  PHOTOVOLTAIQUE = "photovoltaique",
}

/**
 * Pertinence de la réponse à la question de mutabilité
 */
export enum PertinenceReponse {
  OUI = "OUI",
  NON = "NON",
}
