/**
 * Modèle UI pour l'affichage d'une parcelle enrichie
 * Convertit les données enrichies en strings formatées pour l'affichage
 */
export interface ParcelleUiModel {
  // Données de base
  surfaceParcelle: string;
  surfaceBatie: string;

  // Informations parcelle
  commune: string;
  identifiantParcelle: string;
  identifiantsParcelles?: string[];
  nombreParcelles?: number;

  // Environnement
  centreVille: string;
  distanceAutoroute: string;
  distanceTransportsEnCommun: string;
  proximiteCommerces: string;
  distanceRaccordement: string;
  tauxLV: string;

  // Risques et zonage
  risquesTechno: string;
  risquesNaturels: string[];
  zonageEnviro: string;
  zonageUrba: string;
  zonagePatrimonial: string;

  // Pollution - indique si le site est reference dans les bases SIS/ICPE/ADEME
  siteReferencePollue: boolean;

  // Énergies renouvelables
  zoneAccelerationEnr: string;
  /** Badges cumulatifs par filière ZAENR présente (ex: ["Oui", "Oui Eolien"]) */
  zaerBadges?: string[];
}
