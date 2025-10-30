/**
 * Types spécifiques pour l'API TRI Zonage (Territoires à Risques importants d'Inondation)
 */

/**
 * Type d'inondation
 */
export interface TriZonageTypeInondation {
  code: string;
  libelle: string;
}

/**
 * Scénario TRI
 */
export interface TriZonageScenario {
  code: string;
  libelle: string;
}

/**
 * Item TRI (Territoire à Risque important d'Inondation)
 */
export interface TriZonageItem {
  code_national_tri: string;
  identifiant_tri: string;
  libelle_tri: string;
  cours_deau: string;
  typeInondation: TriZonageTypeInondation;
  scenario: TriZonageScenario;
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
export interface TriZonageApiResponse {
  results: number;
  data: TriZonageItem[];
  response_code: number;
  message: string;
}

/**
 * Résultat TRI normalisé pour Mutafriches
 */
export interface TriZonageResultNormalized {
  exposition: boolean; // true si au moins 1 TRI
  nombreTri: number;
  tri: TriZonageNormalized[]; // Liste des TRI
  typesInondation: string[]; // Types d'inondation uniques
  coursEau: string[]; // Cours d'eau concernés
  source: string;
  dateRecuperation: string;
}

/**
 * TRI normalisé
 */
export interface TriZonageNormalized {
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
export interface TriZonageSearchParams {
  latitude: number;
  longitude: number;
}
