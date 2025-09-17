import { ApiResponse } from "../shared/api-response.types";

/**
 * Bâtiment enrichi pour les réponses de service
 */
export interface BdnbBatiment {
  id: string;
  surface: number;
  usage: string;
  etat: string;
  anneeConstruction?: number;
  hauteur?: number;
  nbNiveaux?: number;
  nbLogements?: number;
  materiauxMur?: string;
  materiauxToit?: string;
  classeEnergetique?: string;
}

/**
 * Interface pour la réponse brute de l'API BDNB
 * Correspond exactement aux champs retournés par l'endpoint /donnees/batiment_groupe_complet/parcelle
 */
export interface BdnbBatimentGroupeComplet {
  batiment_groupe_id: string;
  parcelle_id: string;
  surface_emprise_sol: number;
  s_geom_groupe: number;
  hauteur_mean: number;
  nb_niveau: number;
  nb_log: number;
  annee_construction: number;
  usage_niveau_1_txt: string;
  usage_principal_bdnb_open: string;
  mat_mur_txt: string;
  mat_toit_txt: string;
  classe_bilan_dpe: string;
  classe_conso_energie_arrete_2012: string;

  // Risques naturels
  alea_argiles: string;
  alea_radon: string;
  altitude_sol_mean: number;

  // Localisation
  code_commune_insee: string;
  libelle_commune_insee: string;
  libelle_adr_principale_ban: string;
  quartier_prioritaire: boolean;

  // Patrimoine
  distance_batiment_historique_plus_proche: number;
  nom_batiment_historique_plus_proche: string;
  perimetre_bat_historique: boolean;

  // Fiabilité des données
  fiabilite_emprise_sol: string;
  fiabilite_hauteur: string;
  fiabilite_cr_adr_niv_1: string;
}

/**
 * Informations sur les risques naturels
 */
export interface BdnbRisquesNaturels {
  aleaArgiles?: string;
  aleaRadon?: string;
  altitudeMoyenne?: number;
}

/**
 * Informations de localisation
 */
export interface BdnbLocalisation {
  codeCommune?: string;
  libelleCommuneInsee?: string;
  adressePrincipale?: string;
  quartierPrioritaire?: boolean;
}

/**
 * Informations patrimoniales
 */
export interface BdnbPatrimoine {
  distanceBatimentHistorique?: number;
  nomBatimentHistorique?: string;
  perimetreBatimentHistorique?: boolean;
}

/**
 * Réponse enrichie du service BDNB
 */
export interface BdnbServiceResponse {
  parcelle: string;
  batiments: BdnbBatiment[];

  // Surfaces et géométrie
  surfaceTotaleBatie: number;
  surfaceEmpriseAuSol: number;

  // Risques naturels
  risquesNaturels?: BdnbRisquesNaturels;

  // Localisation
  localisation?: BdnbLocalisation;

  // Patrimoine
  patrimoine?: BdnbPatrimoine;

  // Métadonnées de qualité
  fiabiliteEmpriseSol?: string;
  fiabiliteHauteur?: string;
  fiabiliteCroisementAdresse?: string;
}

/**
 * Interface du service BDNB
 */
export interface IBdnbService {
  getSurfaceBatie(identifiantParcelle: string): Promise<ApiResponse<number>>;
  getBatiments(identifiantParcelle: string): Promise<ApiResponse<BdnbServiceResponse>>;
  getRisquesNaturels(identifiantParcelle: string): Promise<ApiResponse<BdnbRisquesNaturels>>;
}
