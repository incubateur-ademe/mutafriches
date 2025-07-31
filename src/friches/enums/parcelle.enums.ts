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
