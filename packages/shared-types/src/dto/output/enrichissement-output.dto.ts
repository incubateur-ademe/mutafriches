import { Coordonnees, GeometrieParcelle } from "../..";

/**
 * Résultat de l'enrichissement automatique des données de parcelle
 * Contient uniquement les données extraites automatiquement depuis des sources externes
 */
export interface EnrichissementOutputDto {
  // Données d'identification
  identifiantParcelle: string;
  codeInsee: string;
  commune: string;
  coordonnees?: Coordonnees; // Coordonnées GPS du point d'entrée de la parcelle
  geometrie?: GeometrieParcelle; // Polygone complet

  // Données physiques du site
  surfaceSite: number;
  surfaceBati?: number;

  // Données de localisation et accessibilité
  siteEnCentreVille: boolean;
  distanceAutoroute: number;
  distanceTransportCommun: number;
  proximiteCommercesServices: boolean;

  // Infrastructure
  distanceRaccordementElectrique: number;

  // Contexte urbain
  tauxLogementsVacants: number;

  // Risques et contraintes
  presenceRisquesTechnologiques: boolean;
  presenceRisquesNaturels?: string; // Enum RisqueNaturel

  // Zonages réglementaires
  zonageReglementaire?: string;
  zonageEnvironnemental?: string; // Enum ZonageEnvironnemental
  zonagePatrimonial?: string; // Enum ZonagePatrimonial
  trameVerteEtBleue?: string; // Enum TrameVerteEtBleue

  // Métadonnées
  sourcesUtilisees: string[];
  champsManquants: string[];
  fiabilite: number; // 0-10
}
