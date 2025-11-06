/**
 * Types spécifiques pour l'API MVT (Mouvements de Terrain)
 */

/**
 * Région
 */
export interface MvtRegion {
  code: string;
  nom: string;
}

/**
 * Département
 */
export interface MvtDepartement {
  code: string;
  nom: string;
}

/**
 * Type de mouvement de terrain
 */
export type MvtType =
  | "Effondrement / Affaissement"
  | "Coulée"
  | "Glissement"
  | "Erosion de berges"
  | "Chute de blocs / Eboulement";

/**
 * Niveau de fiabilité
 */
export type MvtFiabilite = "Faible" | "Moyen" | "Fort";

/**
 * Item MVT (Mouvement de Terrain)
 */
export interface MvtItem {
  identifiant: string;
  type: string;
  region: MvtRegion;
  departement: MvtDepartement;
  code_insee: string;
  fiabilite: string;
  lieu: string;
  commentaire_lieu: string;
  date_debut: string;
  precision_date: string;
  commentaire_mvt: string;
  longitude: number;
  latitude: number;
  precision_lieu: string;
  date_maj: string;
}

/**
 * Réponse brute de l'API GeoRisques MVT (avec pagination)
 */
export interface MvtApiResponse {
  results: number;
  page: number;
  total_pages: number;
  data: MvtItem[];
  response_code: number;
  message: string;
  next: string | null;
  previous: string | null;
}

/**
 * Résultat MVT normalisé pour Mutafriches
 */
export interface MvtResultNormalized {
  exposition: boolean; // true si au moins 1 mouvement
  nombreMouvements: number;
  mouvementsRecents: MvtNormalized[]; // 5 mouvements les plus proches
  typesMouvements: string[]; // Types uniques
  fiabilites: string[]; // Niveaux de fiabilité
  plusProche?: MvtNormalized; // Mouvement le plus proche
  distancePlusProche?: number; // Distance en mètres
  source: string;
  dateRecuperation: string;
}

/**
 * Mouvement de terrain normalisé
 */
export interface MvtNormalized {
  identifiant: string;
  type: string;
  fiabilite: string;
  lieu: string;
  dateDebut: string;
  distance?: number; // Distance par rapport au point recherché (en mètres)
  latitude: number;
  longitude: number;
}

/**
 * Paramètres de recherche MVT
 */
export interface MvtSearchParams {
  latitude: number;
  longitude: number;
  rayon?: number; // en mètres (max 10000, défaut 1000)
}
