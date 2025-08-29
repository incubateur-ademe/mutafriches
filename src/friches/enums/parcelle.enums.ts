/**
 * Types de propriétaire
 */
export enum TypeProprietaire {
  PUBLIC = 'public',
  PRIVE = 'prive',
  COPRO_INDIVISION = 'copro-indivision',
  MIXTE = 'mixte',
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
  ZNIEFF_TYPE_1_2 = 'znieff_type_1',
  PARC_NATUREL_REGIONAL = 'parc_naturel_regional',
  PARC_NATUREL_NATIONAL = 'parc_naturel_national',
  RESERVE_NATURELLE = 'reserve_naturelle',
  PROXIMITE_ZONE = 'proximite_zone',
}

/**
 * Types de protection patrimoniale
 */
export enum ZonagePatrimonial {
  NON_CONCERNE = 'non_concerne',
  MONUMENT_HISTORIQUE = 'monument_historique',
  SITE_INSCRIT_CLASSE = 'site_inscrit_classe',
  PERIMETRE_ABF = 'perimetre_abf',
  ZPPAUP = 'zppaup',
  AVAP = 'avap',
  SPR = 'spr',
}

/**
 * Zonage réglementaire du PLU(I) ou de la carte communale
 */
export enum ZonageReglementaire {
  ZONE_URBAINE_U = 'zone_urbaine_u',
  ZONE_A_URBANISER_AU = 'zone_a_urbaniser_au',
  ZONE_ACTIVITES = 'zone_activites',
  ZONE_NATURELLE = 'zone_naturelle',
  ZONE_AGRICOLE = 'zone_agricole',
}

/**
 * Position par rapport à la trame verte et bleue
 */
export enum TrameVerteEtBleue {
  HORS_TRAME = 'hors_trame',
  RESERVOIR_BIODIVERSITE = 'reservoir_biodiversite',
  CORRIDOR_A_RESTAURER = 'corridor_a_restaurer',
  CORRIDOR_A_PRESERVER = 'corridor_a_preserver',
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
