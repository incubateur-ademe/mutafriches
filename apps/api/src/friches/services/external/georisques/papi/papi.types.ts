/**
 * Types spécifiques pour l'API PAPI (Programmes d'Actions de Prévention des Inondations)
 */

/**
 * Risque associé à un PAPI
 */
export interface PapiRisque {
  num_risque: string;
  libelle_risque_long: string;
}

/**
 * Item PAPI (Programme d'Actions de Prévention des Inondations)
 */
export interface PapiItem {
  code_national_papi: string;
  libelle_papi: string;
  liste_libelle_risque: PapiRisque[];
  libelle_bassin_risques: string;
  date_labellisation: string;
  date_signature: string;
  date_fin_realisation: string;
  code_insee: string;
  libelle_commune: string;
}

/**
 * Réponse brute de l'API GeoRisques PAPI
 */
export interface PapiApiResponse {
  results: number;
  page: number;
  total_pages: number;
  data: PapiItem[];
  response_code: number;
  message: string;
  next: string | null;
  previous: string | null;
}

/**
 * PAPI normalisé
 */
export interface PapiNormalized {
  codeNational: string;
  libelle: string;
  risques: string[]; // Libellés des risques
  bassinRisques: string;
  codeInsee: string;
  commune: string;
  dateLabellisation: string | null;
  dateSignature: string | null;
  dateFinRealisation: string | null;
  statut: "En cours" | "Terminé" | "Labellisé" | "Inconnu";
}

/**
 * Résultat PAPI normalisé pour Mutafriches
 */
export interface PapiResultNormalized {
  exposition: boolean; // true si au moins 1 PAPI
  nombrePapi: number;
  papi: PapiNormalized[]; // Liste des PAPI
  risquesUniques: string[]; // Liste unique des risques
  communesConcernees: string[]; // Liste des communes concernées
  papiEnCours: number; // Nombre de PAPI en cours
  papiTermines: number; // Nombre de PAPI terminés
  source: string;
  dateRecuperation: string;
}

/**
 * Paramètres de recherche PAPI
 */
export interface PapiSearchParams {
  latitude: number;
  longitude: number;
  rayon?: number; // Rayon en mètres (max 10000, défaut 1000)
}
