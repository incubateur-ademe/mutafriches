// packages/shared-types/src/parcelle.types.ts

/**
 * Coordonnées géographiques
 */
export interface Coordonnees {
  latitude: number;
  longitude: number;
}

/**
 * Structure de base d'une parcelle
 */
export interface ParcelleBase {
  // Identifiants
  identifiantParcelle: string;
  commune: string;

  // Dimensions
  surfaceSite?: number;
  surfaceBati?: number;

  // Connexions et réseaux
  connectionReseauElectricite?: boolean;
  distanceRaccordementElectrique?: number;

  // Localisation et accessibilité
  siteEnCentreVille?: boolean;
  distanceAutoroute?: number;
  distanceTransportCommun?: number;
  proximiteCommercesServices?: boolean;

  // Contexte socio-économique
  tauxLogementsVacants?: number;
  ancienneActivite?: string;

  // Risques et contraintes
  presenceRisquesTechnologiques?: boolean;
  presenceRisquesNaturels?: string;

  // Zonages
  zonageEnvironnemental?: string;
  zonageReglementaire?: string;
  zonagePatrimonial?: string;
  trameVerteEtBleue?: string;

  // Localisation
  coordonnees?: Coordonnees;
}

/**
 * Données manuelles saisies par l'utilisateur
 */
export interface DonneesManuellesParcelle {
  typeProprietaire?: string;
  terrainViabilise?: string;
  etatBatiInfrastructure?: string;
  presencePollution?: string;
  valeurArchitecturaleHistorique?: string;
  qualitePaysage?: string;
  qualiteVoieDesserte?: string;
}

/**
 * Parcelle complète avec toutes les données
 */
export interface ParcelleComplete extends ParcelleBase, DonneesManuellesParcelle {
  // Métadonnées
  sourcesUtilisees?: string[];
  champsManquants?: string[];
  fiabilite?: number;
  sessionId?: string;
}
