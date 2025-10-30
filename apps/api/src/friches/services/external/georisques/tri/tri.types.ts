/**
 * Types spécifiques pour l'API TRI (Territoires à Risques importants d'Inondation)
 */

/**
 * Risque associé à un TRI
 */
export interface TriRisque {
  num_risque: string;
  libelle_risque_long: string;
}

/**
 * Item TRI (Territoire à Risque important d'Inondation)
 */
export interface TriItem {
  code_national_tri: string;
  libelle_tri: string;
  liste_libelle_risque: TriRisque[];
  libelle_bassin_risques: string;
  date_arrete_pcb: string;
  date_arrete_carte: string;
  date_arrete_pcb_local: string;
  date_arrete_prefet_parties_prenantes: string;
  date_arrete_approbation: string;
  date_arrete_national: string;
  code_insee: string;
  libelle_commune: string;
}

/**
 * Réponse brute de l'API GeoRisques TRI
 */
export interface TriApiResponse {
  results: number;
  page: number;
  total_pages: number;
  data: TriItem[];
  response_code: number;
  message: string;
  next: string | null;
  previous: string | null;
}

/**
 * TRI normalisé
 */
export interface TriNormalized {
  codeNational: string;
  libelle: string;
  risques: string[]; // Libellés des risques
  bassinRisques: string;
  codeInsee: string;
  commune: string;
  dateArreteApprobation: string | null;
}

/**
 * Résultat TRI normalisé pour Mutafriches
 */
export interface TriResultNormalized {
  exposition: boolean; // true si au moins 1 TRI
  nombreTri: number;
  tri: TriNormalized[]; // Liste des TRI
  risquesUniques: string[]; // Liste unique des risques
  communesConcernees: string[]; // Liste des communes concernées
  source: string;
  dateRecuperation: string;
}

/**
 * Paramètres de recherche TRI
 */
export interface TriSearchParams {
  latitude: number;
  longitude: number;
  rayon?: number; // Rayon en mètres (max 10000, défaut 1000)
}
