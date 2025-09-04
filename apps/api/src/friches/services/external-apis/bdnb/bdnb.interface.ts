import { ApiResponse } from "../shared/api-response.interface";

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
