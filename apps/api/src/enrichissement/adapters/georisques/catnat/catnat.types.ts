/**
 * Types spécifiques pour l'API CATNAT (Catastrophes Naturelles)
 */

/**
 * Item d'arrêté de catastrophe naturelle
 */
export interface CatnatItem {
  code_national_catnat: string;
  date_debut_evt: string; // format ISO date
  date_fin_evt: string;
  date_publication_arrete: string;
  date_publication_jo: string;
  libelle_risque_jo: string;
  code_insee: string;
  libelle_commune: string;
}

/**
 * Réponse brute de l'API GeoRisques CATNAT (avec pagination)
 */
export interface CatnatApiResponse {
  results: number;
  page: number;
  total_pages: number;
  data: CatnatItem[];
  response_code: number;
  message: string;
  next: string | null;
  previous: string | null;
}

/**
 * Résultat CATNAT normalisé pour Mutafriches
 */
export interface CatnatResultNormalized {
  nombreEvenements: number;
  evenementsRecents: CatnatEventNormalized[]; // 5 derniers événements
  typesRisques: string[]; // Types de risques uniques
  dernierEvenement?: CatnatEventNormalized;
  exposition: boolean; // true si au moins 1 événement
  source: string;
  dateRecuperation: string;
}

/**
 * Événement CATNAT normalisé
 */
export interface CatnatEventNormalized {
  codeNational: string;
  typeRisque: string;
  dateDebut: string;
  dateFin: string;
  datePublication: string;
}

/**
 * Paramètres de recherche CATNAT
 */
export interface CatnatSearchParams {
  latitude: number;
  longitude: number;
  rayon?: number; // en mètres (max 10000, défaut 1000)
  codeInsee?: string;
}
