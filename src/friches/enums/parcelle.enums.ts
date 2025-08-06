/**
 * Niveau de risques naturels (inondations, argiles, etc.)
 */
export enum RisqueNaturel {
  AUCUN = 'aucun',
  FAIBLE = 'faible',
  MOYEN = 'moyen',
  FORT = 'fort',
}

/**
 * Types de zonage environnemental
 */
export enum ZonageEnvironnemental {
  HORS_ZONE = 'hors_zone',
  NATURA_2000 = 'natura_2000',
  ZNIEFF_TYPE_1 = 'znieff_type_1',
  ZNIEFF_TYPE_2 = 'znieff_type_2',
  PARC_NATUREL_REGIONAL = 'parc_naturel_regional',
  PARC_NATUREL_NATIONAL = 'parc_naturel_national',
  RESERVE_NATURELLE = 'reserve_naturelle',
}

/**
 * Types de protection patrimoniale
 */
export enum ZonagePatrimonial {
  NON_CONCERNE = 'non_concerne',
  MONUMENT_HISTORIQUE = 'monument_historique',
  SITE_INSCRIT = 'site_inscrit',
  SITE_CLASSE = 'site_classe',
  ZPPAUP = 'zppaup',
  AVAP = 'avap',
  SPR = 'spr',
}

/**
 * Position par rapport à la trame verte et bleue
 */
export enum TrameVerteEtBleue {
  HORS_TRAME = 'hors_trame',
  CORRIDOR_ECOLOGIQUE = 'corridor_ecologique',
  RESERVOIR_BIODIVERSITE = 'reservoir_biodiversite',
  ZONE_HUMIDE = 'zone_humide',
  COURS_EAU = 'cours_eau',
}

/**
 * Types de propriétaire
 */
export enum TypeProprietaire {
  PUBLIC = 'public',
  PRIVE = 'prive',
  MIXTE = 'mixte',
  COPRO_INDIVISION = 'copro-indivision',
  NE_SAIT_PAS = 'ne-sait-pas',
}

/**
 * Connexion aux réseaux d'eau
 */
export enum ReseauEaux {
  OUI = 'oui',
  NON = 'non',
  NE_SAIT_PAS = 'ne-sait-pas',
}

/**
 * État des constructions/bâtiments
 */
export enum EtatBati {
  PAS_DE_BATI = 'pas-de-bati',
  EN_RUINE_DANGEREUX = 'en-ruine-dangereux',
  FORTE_DEGRADATION = 'forte-degradation',
  ETAT_MOYEN = 'etat-moyen',
  BON_ETAT_APPARENT = 'bon-etat-apparent',
  ETAT_REMARQUABLE = 'etat-remarquable',
  BATIMENTS_HETEROGENES = 'batiments-heterogenes',
  NE_SAIT_PAS = 'ne-sait-pas',
}

/**
 * Présence de pollution
 */
export enum PresencePollution {
  NON = 'non',
  DEJA_GEREE = 'deja-geree',
  OUI_COMPOSES_VOLATILS = 'oui-composes-volatils',
  OUI_AUTRES_COMPOSES = 'oui-autres-composes',
  NE_SAIT_PAS = 'ne-sait-pas',
}

/**
 * Valeur architecturale et historique
 */
export enum ValeurArchitecturale {
  SANS_INTERET = 'sans-interet',
  BANAL_INFRA_ORDINAIRE = 'banal-infra-ordinaire',
  ORDINAIRE = 'ordinaire',
  INTERET_FORT = 'interet-fort',
  EXCEPTIONNEL = 'exceptionnel',
  NE_SAIT_PAS = 'ne-sait-pas',
}

/**
 * Qualité du paysage environnant
 */
export enum QualitePaysage {
  DEGRADE = 'degrade',
  BANAL_INFRA_ORDINAIRE = 'banal-infra-ordinaire',
  QUOTIDIEN_ORDINAIRE = 'quotidien-ordinaire',
  INTERESSANT = 'interessant',
  REMARQUABLE = 'remarquable',
  NE_SAIT_PAS = 'ne-sait-pas',
}

/**
 * Qualité de la desserte/accessibilité
 */
export enum QualiteDesserte {
  ACCESSIBLE = 'accessible',
  DEGRADEE = 'degradee',
  PEU_ACCESSIBLE = 'peu-accessible',
  NE_SAIT_PAS = 'ne-sait-pas',
}
