/**
 * Type pour l'affichage UI d'une parcelle
 * Convertit les données enrichies en strings pour l'affichage
 */
export interface UiParcelleDto {
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
  potentielEcologique: string;
}
