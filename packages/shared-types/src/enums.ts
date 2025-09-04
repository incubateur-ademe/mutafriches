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
  BANAL_INFRA_ORDINAIRE = "banal-infra-ordinaire",
  ORDINAIRE = "ordinaire",
  INTERET_FORT = "interet-fort",
  EXCEPTIONNEL = "exceptionnel",
  NE_SAIT_PAS = "ne-sait-pas",
}

/**
 * Qualité du paysage
 */
export enum QualitePaysage {
  DEGRADE = "degrade",
  BANAL_INFRA_ORDINAIRE = "banal-infra-ordinaire",
  QUOTIDIEN_ORDINAIRE = "quotidien-ordinaire",
  INTERESSANT = "interessant",
  REMARQUABLE = "remarquable",
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
 * Alias pour compatibilité avec l'ancienne API
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
 * Pertinence de la réponse
 */
export enum PertinenceReponse {
  OUI = "OUI",
  NON = "NON",
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

/**
 * Enums additionnels de l'API
 */
export enum EtatBati {
  PAS_DE_BATI = "pas-de-bati",
  EN_RUINE_DANGEREUX = "en-ruine-dangereux",
  FORTE_DEGRADATION = "forte-degradation",
  ETAT_MOYEN = "etat-moyen",
  BON_ETAT_APPARENT = "bon-etat-apparent",
  ETAT_REMARQUABLE = "etat-remarquable",
  BATIMENTS_HETEROGENES = "batiments-heterogenes",
  NE_SAIT_PAS = "ne-sait-pas",
}

export enum RisqueNaturel {
  AUCUN = "aucun",
  FAIBLE = "faible",
  MOYEN = "moyen",
  FORT = "fort",
}

export enum ZonageEnvironnemental {
  HORS_ZONE = "hors-zone",
  NATURA_2000 = "natura-2000",
  ZNIEFF_TYPE_1_2 = "znieff-type-1-2",
  PARC_NATUREL_REGIONAL = "parc-naturel-regional",
  PARC_NATUREL_NATIONAL = "parc-naturel-national",
  RESERVE_NATURELLE = "reserve-naturelle",
  PROXIMITE_ZONE = "proximite-zone",
}

export enum ZonagePatrimonial {
  NON_CONCERNE = "non-concerne",
  MONUMENT_HISTORIQUE = "monument-historique",
  SITE_INSCRIT_CLASSE = "site-inscrit-classe",
  PERIMETRE_ABF = "perimetre-abf",
  ZPPAUP = "zppaup",
  AVAP = "avap",
  SPR = "spr",
}

export enum ZonageReglementaire {
  ZONE_URBAINE_U = "zone-urbaine-u",
  ZONE_A_URBANISER_AU = "zone-a-urbaniser-au",
  ZONE_ACTIVITES = "zone-activites",
  ZONE_NATURELLE = "zone-naturelle",
  ZONE_AGRICOLE = "zone-agricole",
  ZONE_ACCELERATION_ENR = "zone-acceleration-enr",
  ZONE_MIXTE_MULTIPLE = "zone-mixte-multiple",
  CONSTRUCTIBLE = "constructible",
  NON_CONSTRUCTIBLE = "non-constructible",
}

export enum TrameVerteEtBleue {
  HORS_TRAME = "hors-trame",
  RESERVOIR_BIODIVERSITE = "reservoir-biodiversite",
  CORRIDOR_A_RESTAURER = "corridor-a-restaurer",
  CORRIDOR_A_PRESERVER = "corridor-a-preserver",
}

// Enums non utilisés dans la version web mais présents dans l'API
export enum CouvertVegetal {
  IMPERMEABILISE = "impermeabilise",
  SOL_NU_FAIBLEMENT_HERBACE = "sol-nu-faiblement-herbace",
  VEGETATION_ARBUSTIVE_FAIBLE = "vegetation-arbustive-faible",
  VEGETATION_ARBUSTIVE_PREDOMINANTE = "vegetation-arbustive-predominante",
}

export enum PresenceEspeceProtegee {
  OUI = "oui",
  NON = "non",
  NE_SAIT_PAS = "ne-sait-pas",
}

export enum ZoneHumide {
  PRESENCE_AVEREE = "presence-averee",
  PRESENCE_POTENTIELLE = "presence-potentielle",
  ABSENCE = "absence",
}

export enum VoieEauProximite {
  OUI_NAVIGABLE = "oui-navigable",
  OUI_NON_NAVIGABLE = "oui-non-navigable",
  NON = "non",
}
