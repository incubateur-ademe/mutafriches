/**
 * Types spécifiques pour l'API SIS (Secteurs d'Information sur les Sols)
 */

/**
 * Géométrie GeoJSON (utilisée dans la réponse SIS)
 */
export interface SisGeoJsonGeometry {
  crs?: {
    type: string;
    properties: Record<string, unknown>;
  };
  bbox?: number[];
  type: string;
  properties?: Record<string, unknown>;
  geometry?: string;
  id?: string;
}

/**
 * Données brutes d'un SIS depuis l'API GeoRisques
 */
export interface SisApiData {
  nom: string;
  adresse: string;
  superficie: number;
  geom: SisGeoJsonGeometry;
  id_sis: string;
  identifiant_ssp: string;
  adresse_lieudit: string;
  code_insee: string;
  nom_commune: string;
  fiche_risque: string;
  date_maj: string;
  statut_classification: string;
}

/**
 * Réponse brute de l'API GeoRisques SIS
 */
export interface SisApiResponse {
  results: number;
  page: number;
  total_pages: number;
  data: SisApiData[];
  response_code: number;
  message: string;
  next: string | null;
  previous: string | null;
}

/**
 * Statut de classification SIS normalisé
 */
export type SisStatutClassification =
  | "À évaluer"
  | "En cours d'évaluation"
  | "Évalué"
  | "Non concerné"
  | string; // Fallback pour valeurs inconnues

/**
 * Résultat SIS normalisé pour Mutafriches
 */
export interface SisResultNormalized {
  presenceSis: boolean;
  nombreSis: number;
  sisProches: SisSummary[];
  source: string;
  dateRecuperation: string;
}

/**
 * Résumé d'un SIS (pour affichage simplifié)
 */
export interface SisSummary {
  id: string;
  nom: string;
  adresse: string;
  superficie: number;
  commune: string;
  statutClassification: SisStatutClassification;
  ficheRisque: string;
  dateMaj: string;
  distance?: number; // Distance en mètres (si recherche par rayon)
}

/**
 * Paramètres de recherche SIS par code INSEE
 */
export interface SisSearchByInseeParams {
  codeInsee: string;
  pageSize?: number;
}

/**
 * Paramètres de recherche SIS par coordonnées
 */
export interface SisSearchByLatLonParams {
  latitude: number;
  longitude: number;
  rayon?: number; // en mètres (max 10000, défaut 1000)
  pageSize?: number;
}
