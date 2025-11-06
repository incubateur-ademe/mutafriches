/**
 * Types spécifiques pour l'API Zonage Sismique
 */

/**
 * Niveau de sismicité (1 à 5)
 */
export type ZoneSismicite = "1" | "2" | "3" | "4" | "5";

/**
 * Item de zonage sismique
 */
export interface ZonageSismiqueItem {
  code_insee: string;
  libelle_commune: string;
  code_zone: string; // "1" à "5"
  zone_sismicite: string; // "Très faible", "Faible", "Modérée", "Moyenne", "Fort"
}

/**
 * Réponse brute de l'API GeoRisques Zonage Sismique (avec pagination)
 */
export interface ZonageSismiqueApiResponse {
  results: number;
  page: number;
  total_pages: number;
  data: ZonageSismiqueItem[];
  response_code: number;
  message: string;
  next: string | null;
  previous: string | null;
}

/**
 * Résultat Zonage Sismique normalisé pour Mutafriches
 */
export interface ZonageSismiqueResultNormalized {
  exposition: boolean; // true si zone > 1
  codeZone: ZoneSismicite;
  libelle: string; // "Très faible", "Faible", "Modérée", "Moyenne", "Fort"
  commune: string;
  codeInsee: string;
  source: string;
  dateRecuperation: string;
}

/**
 * Paramètres de recherche Zonage Sismique
 */
export interface ZonageSismiqueSearchParams {
  latitude: number;
  longitude: number;
  codeInsee?: string; // Optionnel, peut être déduit des coordonnées
}

/**
 * Mapping des codes zones vers les libellés
 */
export const ZONAGE_SISMIQUE_LIBELLES: Record<ZoneSismicite, string> = {
  "1": "Très faible",
  "2": "Faible",
  "3": "Modérée",
  "4": "Moyenne",
  "5": "Fort",
};
