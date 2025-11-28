/**
 * Codes équipements BPE pertinents pour Mutafriches
 *
 * Source: INSEE BPE 2024
 * Documentation: https://www.insee.fr/fr/statistiques/8217537
 */

/**
 * Codes équipements pour les transports en commun
 * Utilisés pour calculer la distance au transport le plus proche
 */
export const BPE_CODES_TRANSPORTS = [
  "E107", // Gare de voyageurs d'intérêt national (>= 250 000 voyageurs/an)
  "E108", // Gare de voyageurs d'intérêt régional (100 000 - 250 000 voyageurs/an)
  "E109", // Gare de voyageurs d'intérêt local (< 100 000 voyageurs/an)
] as const;

/**
 * Codes équipements pour les commerces et services
 * Utilisés pour déterminer la présence de commerces à proximité (500m)
 */
export const BPE_CODES_COMMERCES_SERVICES = [
  // Grandes surfaces alimentaires
  "B104", // Hypermarché et grand magasin (>= 2500 m²)
  "B105", // Supermarché et magasin multi-commerce (400-2500 m²)

  // Commerces alimentaires de proximité
  "B201", // Supérette (120-400 m²)
  "B202", // Épicerie (< 120 m²)
  "B204", // Boucherie charcuterie
  "B206", // Poissonnerie
  "B207", // Boulangerie-pâtisserie

  // Services bancaires et postaux
  "A203", // Banque, caisse d'épargne
  "A206", // Bureau de poste
  "A207", // Relais poste
  "A208", // Agence postale

  // Santé de proximité
  "D307", // Pharmacie
] as const;

/**
 * Tous les codes équipements à importer
 */
export const BPE_CODES_A_IMPORTER = [
  ...BPE_CODES_TRANSPORTS,
  ...BPE_CODES_COMMERCES_SERVICES,
] as const;

/**
 * Colonnes du CSV BPE à conserver
 */
export const BPE_COLONNES_A_GARDER = [
  "TYPEQU", // Code type équipement
  "DEPCOM", // Code commune INSEE
  "LONGITUDE", // Longitude WGS84
  "LATITUDE", // Latitude WGS84
  "QUALITE_XY", // Qualité géolocalisation (A=bonne, B=acceptable, M=manuelle)
  "AN", // Année de référence
] as const;

/**
 * Configuration du fichier BPE
 */
export const BPE_CONFIG = {
  /** Séparateur CSV */
  SEPARATOR: ";",
  /** Encodage du fichier source */
  ENCODING: "latin1" as BufferEncoding,
  /** Taille du batch pour les insertions DB */
  BATCH_SIZE: 1000,
  /** Nom du dataset pour les logs */
  DATASET_NAME: "bpe",
} as const;

export type BpeCodeTransport = (typeof BPE_CODES_TRANSPORTS)[number];
export type BpeCodeCommerceService = (typeof BPE_CODES_COMMERCES_SERVICES)[number];
export type BpeCode = (typeof BPE_CODES_A_IMPORTER)[number];
