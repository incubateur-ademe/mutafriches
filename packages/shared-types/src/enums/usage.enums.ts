/**
 * Enums utilisés pour les résultats de calcul de mutabilité
 */

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
 * Labels d'affichage pour les usages (UI uniquement)
 * TODO: À déplacer dans le code front
 */
export const UsageLabels: Record<UsageType, string> = {
  [UsageType.RESIDENTIEL]: "Résidentiel ou mixte",
  [UsageType.EQUIPEMENTS]: "Équipements publics",
  [UsageType.CULTURE]: "Culture, tourisme",
  [UsageType.TERTIAIRE]: "Tertiaire",
  [UsageType.INDUSTRIE]: "Industrie",
  [UsageType.RENATURATION]: "Renaturation",
  [UsageType.PHOTOVOLTAIQUE]: "Photovoltaïque au sol",
};
