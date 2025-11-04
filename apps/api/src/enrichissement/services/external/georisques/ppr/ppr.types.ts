/**
 * Types spécifiques pour l'API PPR (Plan de Prévention des Risques)
 * ⚠️ ATTENTION: Cette API est marquée comme OBSOLETE dans la documentation GeoRisques
 */

/**
 * État d'un PPR
 */
export interface PprEtat {
  code_etat: string; // 01: Prescrit, 02: Approuvé, 03: Abrogé, 04: Appliqué par anticipation
  libelle_etat: string;
}

/**
 * Classe d'aléa
 */
export interface PprClasseAlea {
  code: string;
  libelle: string;
}

/**
 * Risque associé à un PPR
 */
export interface PprRisque {
  code_risque: string; // 11: Inondation, 12: Mouvements de terrain, 13: Séisme, etc.
  libelle_risque: string;
  classes_alea: PprClasseAlea[];
}

/**
 * Géométrie (simplifié - on ne traite pas les détails géométriques pour le MVP)
 */
export interface PprGeometrie {
  type: string;
  features?: unknown[];
  // Autres propriétés géométriques non utilisées pour Mutafriches
}

/**
 * Item PPR (Plan de Prévention des Risques)
 */
export interface PprItem {
  etat: PprEtat;
  id_gaspar: string;
  nom_ppr: string;
  date_approbation: string;
  date_fin_validite: string;
  risque: PprRisque;
  libelle_commune: string;
  geom_perimetre: PprGeometrie;
  geom_zonage: PprGeometrie;
}

/**
 * Réponse brute de l'API GeoRisques PPR
 */
export interface PprApiResponse {
  results: number;
  page: number;
  total_pages: number;
  data: PprItem[];
  response_code: number;
  message: string;
  next: string | null;
  previous: string | null;
}

/**
 * PPR normalisé
 */
export interface PprNormalized {
  idGaspar: string;
  nom: string;
  etat: string; // Libellé de l'état
  codeEtat: string; // Code de l'état
  typeRisque: string;
  codeRisque: string;
  classesAlea: string[]; // Liste des classes d'aléa
  commune: string;
  dateApprobation: string | null;
  dateFinValidite: string | null;
  estActif: boolean; // true si approuvé ou appliqué par anticipation
}

/**
 * Résultat PPR normalisé pour Mutafriches
 */
export interface PprResultNormalized {
  exposition: boolean; // true si au moins 1 PPR
  nombrePpr: number;
  ppr: PprNormalized[]; // Liste des PPR
  typesRisquesUniques: string[]; // Liste unique des types de risques
  pprActifs: number; // Nombre de PPR approuvés ou appliqués par anticipation
  pprPrescrits: number; // Nombre de PPR prescrits
  pprAbroges: number; // Nombre de PPR abrogés
  communesConcernees: string[]; // Liste des communes concernées
  source: string;
  dateRecuperation: string;
}

/**
 * Paramètres de recherche PPR
 */
export interface PprSearchParams {
  latitude: number;
  longitude: number;
  rayon?: number; // Rayon en mètres (max 10000, défaut 1000)
  codeEtat?: string; // Filtrer par état (ex: "01,02" pour Prescrit et Approuvé)
  codeRisque?: string; // Filtrer par type de risque (ex: "11,12" pour Inondation et Mouvements de terrain)
}

/**
 * Codes d'état PPR
 */
export enum PprCodeEtat {
  PRESCRIT = "01",
  APPROUVE = "02",
  ABROGE = "03",
  APPLIQUE_PAR_ANTICIPATION = "04",
}

/**
 * Codes de risques principaux
 */
export enum PprCodeRisque {
  INONDATION = "11",
  MOUVEMENTS_TERRAIN = "12",
  SEISME = "13",
  AVALANCHE = "14",
  FEU_FORET = "16",
  PHENOMENES_METEO = "17",
  RISQUE_INDUSTRIEL = "21",
}
