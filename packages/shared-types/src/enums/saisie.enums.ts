/**
 * Enums utilisés pour les données saisies par l'utilisateur
 * Complètent les données d'enrichissement automatique
 */

/**
 * Type de propriétaire de la parcelle
 */
export enum TypeProprietaire {
  PUBLIC = "public",
  PRIVE = "prive",
  MIXTE = "mixte",
  COPRO_INDIVISION = "copro-indivision",
  NE_SAIT_PAS = "ne-sait-pas",
}

/**
 * Site connecté aux réseaux d'eau et assainissement
 */
export enum RaccordementEau {
  OUI = "oui",
  NON = "non",
  NE_SAIT_PAS = "ne-sait-pas",
}

/**
 * État général du bâti et des infrastructures
 */
export enum EtatBatiInfrastructure {
  DEGRADATION_TRES_IMPORTANTE = "degradation-tres-importante",
  DEGRADATION_MOYENNE = "degradation-moyenne",
  DEGRADATION_INEXISTANTE = "degradation-inexistante",
  DEGRADATION_HETEROGENE = "degradation-heterogene",
  PAS_DE_BATI = "pas-de-bati",
  NE_SAIT_PAS = "ne-sait-pas",
}

/**
 * Présence de pollution connue ou suspectée
 */
export enum PresencePollution {
  NON = "non",
  DEJA_GEREE = "deja-geree",
  OUI_COMPOSES_VOLATILS = "oui-composes-volatils",
  OUI_AUTRES_COMPOSES = "oui-autres-composes",
  NE_SAIT_PAS = "ne-sait-pas",
}

/**
 * Valeur architecturale et/ou historique du site
 */
export enum ValeurArchitecturale {
  SANS_INTERET = "sans-interet",
  ORDINAIRE = "ordinaire",
  INTERET_REMARQUABLE = "interet-remarquable",
  NE_SAIT_PAS = "ne-sait-pas",
}

/**
 * Qualité du paysage environnant
 */
export enum QualitePaysage {
  SANS_INTERET = "sans-interet",
  ORDINAIRE = "ordinaire",
  INTERET_REMARQUABLE = "interet-remarquable",
  NE_SAIT_PAS = "ne-sait-pas",
}

/**
 * Qualité et accessibilité de la voie de desserte
 */
export enum QualiteVoieDesserte {
  ACCESSIBLE = "accessible",
  DEGRADEE = "degradee",
  PEU_ACCESSIBLE = "peu-accessible",
  NE_SAIT_PAS = "ne-sait-pas",
}
