/**
 * Types spécifiques pour l'API AZI (Atlas des Zones Inondables)
 */

/**
 * Risque associé à un AZI
 */
export interface AziRisque {
  num_risque: string;
  libelle_risque_long: string;
}

/**
 * Item AZI (Atlas des Zones Inondables)
 */
export interface AziItem {
  code_national_azi: string;
  libelle_azi: string;
  liste_libelle_risque: AziRisque[];
  libelle_bassin_risques: string;
  date_debut_programmation: string;
  date_fin_programmation: string;
  date_debut_etude: string;
  date_fin_etude: string;
  date_debut_information: string;
  date_fin_information: string;
  date_realisation: string;
  date_diffusion: string;
  date_publication_web: string;
  code_insee: string;
  libelle_commune: string;
}

/**
 * Réponse brute de l'API GeoRisques AZI
 */
export interface AziApiResponse {
  results: number;
  page: number;
  total_pages: number;
  data: AziItem[];
  response_code: number;
  message: string;
  next: string | null;
  previous: string | null;
}

/**
 * AZI normalisé
 */
export interface AziNormalized {
  codeNational: string;
  libelle: string;
  risques: string[]; // Libellés des risques
  bassinRisques: string;
  codeInsee: string;
  commune: string;
  dateRealisation: string | null;
  dateDiffusion: string | null;
  datePublicationWeb: string | null;
}

/**
 * Résultat AZI normalisé pour Mutafriches
 */
export interface AziResultNormalized {
  exposition: boolean; // true si au moins 1 AZI
  nombreAzi: number;
  azi: AziNormalized[]; // Liste des AZI
  risquesUniques: string[]; // Liste unique des risques
  communesConcernees: string[]; // Liste des communes concernées
  source: string;
  dateRecuperation: string;
}

/**
 * Paramètres de recherche AZI
 */
export interface AziSearchParams {
  latitude: number;
  longitude: number;
  rayon?: number; // Rayon en mètres (max 10000, défaut 1000)
}
