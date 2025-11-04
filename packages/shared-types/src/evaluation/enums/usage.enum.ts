/**
 * Types d'usage pour le calcul de mutabilité
 * Utilisé comme identifiant technique dans l'API
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
 * Source d'utilisation de l'API
 */
export enum SourceUtilisation {
  SITE_STANDALONE = "SITE_STANDALONE",
  IFRAME_INTEGREE = "IFRAME_INTEGREE",
  API_DIRECTE = "API_DIRECTE",
}
