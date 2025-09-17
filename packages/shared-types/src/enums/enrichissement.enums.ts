/**
 * Enums utilisés pour les données d'enrichissement automatique
 * Issues des APIs externes (cadastre, BDNB, etc.)
 */

/**
 * Niveau de risques naturels (inondations, argiles, etc.)
 */
export enum RisqueNaturel {
  AUCUN = "aucun",
  FAIBLE = "faible",
  MOYEN = "moyen",
  FORT = "fort",
}

/**
 * Type de zonage environnemental applicable
 */
export enum ZonageEnvironnemental {
  HORS_ZONE = "hors-zone",
  NATURA_2000 = "natura-2000",
  ZNIEFF_TYPE_1_2 = "znieff-type-1-2",
  PARC_NATUREL_REGIONAL = "parc-naturel-regional",
  PARC_NATUREL_NATIONAL = "parc-naturel-national",
  RESERVE_NATURELLE = "reserve-naturelle",
  PROXIMITE_ZONE = "proximite-zone",
}

/**
 * Zonage réglementaire selon le PLU/PLUi
 */
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

/**
 * Type de protection patrimoniale
 */
export enum ZonagePatrimonial {
  NON_CONCERNE = "non-concerne",
  MONUMENT_HISTORIQUE = "monument-historique",
  SITE_INSCRIT_CLASSE = "site-inscrit-classe",
  PERIMETRE_ABF = "perimetre-abf",
  ZPPAUP = "zppaup",
  AVAP = "avap",
  SPR = "spr",
}

/**
 * Position par rapport à la trame verte et bleue
 */
export enum TrameVerteEtBleue {
  HORS_TRAME = "hors-trame",
  RESERVOIR_BIODIVERSITE = "reservoir-biodiversite",
  CORRIDOR_A_RESTAURER = "corridor-a-restaurer",
  CORRIDOR_A_PRESERVER = "corridor-a-preserver",
}
