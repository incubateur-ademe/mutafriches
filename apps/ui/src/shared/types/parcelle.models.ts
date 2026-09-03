import { IlotChaleurUrbain } from "@mutafriches/shared-types";

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
  /** Catégorie de distance à une Installation Terminale Embranchée (ITE) fret */
  distanceIte: string;
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

  // Zonage ABC logement
  zonageAbcLogement: string;

  /** Exposition à un îlot de chaleur urbain — informatif, hors algorithme */
  ilotChaleurUrbain?: IlotChaleurUrbain;

  // Énergies renouvelables
  zoneAccelerationEnr: string;
  /** Badges cumulatifs par filière ZAENR présente (ex: ["Oui", "Oui Eolien"]) */
  zaerBadges?: string[];
}
