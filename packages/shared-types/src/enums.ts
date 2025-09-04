// packages/shared-types/src/enums.ts

/**
 * Types de propriétaire pour une parcelle
 */
export enum TypeProprietaire {
  PUBLIC = "public",
  PRIVE = "prive",
  MIXTE = "mixte",
  COPRO_INDIVISION = "copro-indivision",
  NE_SAIT_PAS = "ne-sait-pas",
}

/**
 * État des bâtiments et infrastructures
 */
export enum EtatBatiInfrastructure {
  DEGRADATION_TRES_IMPORTANTE = "degradation-tres-importante",
  DEGRADATION_MOYENNE = "degradation-moyenne",
  DEGRADATION_INEXISTANTE = "degradation-inexistante",
  DEGRADATION_HETEROGENE = "degradation-heterogene",
  NE_SAIT_PAS = "ne-sait-pas",
}

/**
 * Présence de pollution
 */
export enum PresencePollution {
  NON = "non",
  DEJA_GEREE = "deja-geree",
  OUI_COMPOSES_VOLATILS = "oui-composes-volatils",
  OUI_AUTRES_COMPOSES = "oui-autres-composes",
  NE_SAIT_PAS = "ne-sait-pas",
}

/**
 * Valeur architecturale et historique
 */
export enum ValeurArchitecturale {
  SANS_INTERET = "sans-interet",
  ORDINAIRE = "ordinaire",
  INTERET_REMARQUABLE = "interet-remarquable",
  NE_SAIT_PAS = "ne-sait-pas",
}

/**
 * Qualité du paysage
 */
export enum QualitePaysage {
  SANS_INTERET = "sans-interet",
  ORDINAIRE = "ordinaire",
  INTERET_REMARQUABLE = "interet-remarquable",
  NE_SAIT_PAS = "ne-sait-pas",
}

/**
 * Qualité de la voie de desserte
 */
export enum QualiteVoieDesserte {
  ACCESSIBLE = "accessible",
  DEGRADEE = "degradee",
  PEU_ACCESSIBLE = "peu-accessible",
  NE_SAIT_PAS = "ne-sait-pas",
}

/**
 * Terrain viabilisé
 */
export enum TerrainViabilise {
  OUI = "oui",
  NON = "non",
  NE_SAIT_PAS = "ne-sait-pas",
}

/**
 * Types d'usage pour la mutabilité
 */
export enum TypeUsage {
  RESIDENTIEL_MIXTE = "Résidentiel ou mixte",
  EQUIPEMENTS_PUBLICS = "Équipements publics",
  CULTURE_TOURISME = "Culture, tourisme",
  TERTIAIRE = "Tertiaire",
  INDUSTRIE = "Industrie",
  RENATURATION = "Renaturation",
  PHOTOVOLTAIQUE = "Photovoltaïque au sol",
}

/**
 * Niveaux de potentiel
 */
export enum NiveauPotentiel {
  EXCELLENT = "Excellent",
  TRES_BON = "Très bon",
  BON = "Bon",
  MOYEN = "Moyen",
  FAIBLE = "Faible",
  TRES_FAIBLE = "Très faible",
}
