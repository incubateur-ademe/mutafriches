/**
 * Modèle UI pour l'affichage d'une parcelle enrichie
 * Convertit les données enrichies en strings formatées pour l'affichage
 */
export interface ParcelleUiModel {
  // Données de base
  surfaceParcelle: string;
  surfaceBatie: string;
  typeProprietaire: string;

  // Informations parcelle
  commune: string;
  identifiantParcelle: string;

  // Environnement
  centreVille: string;
  distanceAutoroute: string;
  distanceTransportsEnCommun: string;
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
  potentielEcologique: string;
}
