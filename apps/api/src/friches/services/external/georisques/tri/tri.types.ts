/**
 * Types spécifiques pour l'API TRI Zonage (Territoires à Risques importants d'Inondation)
 */

/**
 * Type d'inondation
 */
export interface TriTypeInondation {
  code: string;
  libelle: string;
}

/**
 * Scénario TRI
 */
export interface TriScenario {
  code: string;
  libelle: string;
}

/**
 * Item TRI (Territoire à Risque important d'Inondation)
 */
export interface TriItem {
  code_national_tri: string;
  identifiant_tri: string;
  libelle_tri: string;
  cours_deau: string;
  typeInondation: TriTypeInondation;
  scenario: TriScenario;
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
 * Réponse brute de l'API GeoRisques TRI Zonage
 */
export interface TriApiResponse {
  results: number;
  data: TriItem[];
  response_code: number;
  message: string;
}

/**
 * Résultat TRI normalisé pour Mutafriches
 */
export interface TriResultNormalized {
  exposition: boolean; // true si au moins 1 TRI
  nombreTri: number;
  tri: TriNormalized[]; // Liste des TRI
  typesInondation: string[]; // Types d'inondation uniques
  coursEau: string[]; // Cours d'eau concernés
  source: string;
  dateRecuperation: string;
}

/**
 * TRI normalisé
 */
export interface TriNormalized {
  codeNational: string;
  identifiant: string;
  libelle: string;
  coursEau: string;
  typeInondation: string;
  scenario: string;
}

/**
 * Paramètres de recherche TRI
 */
export interface TriSearchParams {
  latitude: number;
  longitude: number;
}
