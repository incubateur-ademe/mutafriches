// packages/shared-types/src/dto.types.ts

import { ParcelleBase, DonneesManuellesParcelle, ParcelleComplete } from "./parcelle.types";
import { TypeUsage } from "./enums";

/**
 * DTO d'entrée pour l'enrichissement
 */
export interface ParcelleInputDto {
  identifiantParcelle: string;
}

/**
 * Résultat de l'enrichissement automatique
 */
export interface EnrichmentResultDto extends ParcelleBase {
  sourcesUtilisees: string[];
  champsManquants: string[];
  fiabilite: number;
}

/**
 * DTO d'entrée pour le calcul de mutabilité
 */
export interface MutabilityInputDto extends ParcelleComplete {
  // Toutes les données de ParcelleComplete sont nécessaires
}

/**
 * Détail d'un critère pour le mode détaillé
 */
export interface DetailCritereDto {
  critere: string;
  valeur: string | number | boolean;
  scoreBrut: number;
  poids: number;
  scorePondere: number;
}

/**
 * Détails du calcul pour un usage
 */
export interface DetailCalculUsageDto {
  detailsAvantages: DetailCritereDto[];
  detailsContraintes: DetailCritereDto[];
  totalAvantages: number;
  totalContraintes: number;
}

/**
 * Résultat d'un usage spécifique
 */
export interface UsageResultDto {
  rang: number;
  usage: TypeUsage | string;
  indiceMutabilite: number;
  explication?: string;
  potentiel?: string;
  avantages?: number;
  contraintes?: number;
  detailsCalcul?: DetailCalculUsageDto;
}
/**
 * Résultat complet du calcul de mutabilité
 */
export interface MutabilityResultDto {
  fiabilite: {
    note: number;
    text: string;
    description: string;
    criteresRenseignes?: number;
    criteresTotal?: number;
  };
  resultats: UsageResultDto[];
}

/**
 * DTO pour l'affichage UI d'une parcelle
 * (version string pour l'affichage direct)
 */
export interface UiParcelleDto {
  // Données de base
  surfaceParcelle: string;
  surfaceBatie: string;
  typeProprietaire: string;
  ancienneActivite: string;

  // Informations parcelle
  commune: string;
  identifiantParcelle: string;
  connectionElectricite: string;

  // Environnement
  centreVille: string;
  distanceAutoroute: string;
  distanceTrain: string;
  proximiteCommerces: string;
  distanceRaccordement: string;
  tauxLV: string;

  // Risques et zonage
  risquesTechno: string;
  risquesNaturels: string;
  zonageEnviro: string;
  zonageUrba: string;
  zonagePatrimonial: string;
  tvb: string;

  // Données techniques
  potentielEcologique?: string;
}

/**
 * Résultat d'enrichissement pour l'UI
 */
export interface UiEnrichmentResultDto {
  success: boolean;
  data?: UiParcelleDto;
  sources?: string[];
  fiabilite?: number;
  error?: string;
}

/**
 * Données manuelles du formulaire étape 2
 */
export interface ManualFormDataDto extends DonneesManuellesParcelle {
  // Hérite des champs de DonneesManuellesParcelle
}

/**
 * Réponse de sauvegarde des données
 */
export interface SaveDataResponseDto {
  success: boolean;
  message?: string;
  nextStep?: number;
  error?: string;
}
