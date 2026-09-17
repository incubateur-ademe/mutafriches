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
 *
 * PREFETCH isole les appels robots de pré-chauffe du cache : sans lui, ils sont
 * indistinguables d'une qualification utilisateur (cf. ADR-0041).
 */
export enum SourceUtilisation {
  SITE_STANDALONE = "SITE_STANDALONE",
  IFRAME_INTEGREE = "IFRAME_INTEGREE",
  API_DIRECTE = "API_DIRECTE",
  PREFETCH = "PREFETCH",
}
