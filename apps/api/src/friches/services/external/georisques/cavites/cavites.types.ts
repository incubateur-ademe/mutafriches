/**
 * Types spécifiques pour l'API Cavités Souterraines
 */

/**
 * Type de cavité souterraine
 */
export type CaviteType =
  | "Cave"
  | "Naturelle"
  | "Indéterminé"
  | "Ouvrage civil"
  | "Puits"
  | "Divers"
  | "Galerie"
  | "Carrière"
  | "Indice"
  | "Ouvrage militaire"
  | "Réseau galeries"
  | "Souterrain";

/**
 * Région
 */
export interface CaviteRegion {
  code: string;
  nom: string;
}

/**
 * Département
 */
export interface CaviteDepartement {
  code: string;
  nom: string;
}

/**
 * Item Cavité
 */
export interface CaviteItem {
  identifiant: string;
  type: string;
  nom: string;
  reperage_geo: string;
  region: CaviteRegion;
  departement: CaviteDepartement;
  code_insee: string;
  longitude: number;
  latitude: number;
}

/**
 * Réponse brute de l'API GeoRisques Cavités (avec pagination)
 */
export interface CavitesApiResponse {
  results: number;
  page: number;
  total_pages: number;
  data: CaviteItem[];
  response_code: number;
  message: string;
  next: string | null;
  previous: string | null;
}

/**
 * Résultat Cavités normalisé pour Mutafriches
 */
export interface CavitesResultNormalized {
  exposition: boolean; // true si au moins 1 cavité
  nombreCavites: number;
  cavitesProches: CaviteNormalized[]; // N cavités les plus proches
  typesCavites: string[]; // Types uniques
  plusProche?: CaviteNormalized; // Cavité la plus proche
  distancePlusProche?: number; // Distance en mètres
  source: string;
  dateRecuperation: string;
}

/**
 * Cavité normalisée
 */
export interface CaviteNormalized {
  identifiant: string;
  type: string;
  nom: string;
  reperageGeo: string;
  distance?: number; // Distance par rapport au point recherché (en mètres)
  latitude: number;
  longitude: number;
}

/**
 * Paramètres de recherche Cavités
 */
export interface CavitesSearchParams {
  latitude: number;
  longitude: number;
  rayon?: number; // en mètres (max 10000, défaut 1000)
}
