// Types spécifiques pour les fichiers de test JSON

export interface TestCaseInput {
  // Identifiants (optionnels dans les tests)
  identifiantParcelle?: string;
  commune?: string;

  // Propriété et surfaces
  typeProprietaire: string;
  surfaceSite: number;
  surfaceBati?: number;
  nombreBatiments?: number;

  // État du site
  etatBatiInfrastructure: string;
  presencePollution: string;

  // Localisation et accessibilité
  siteEnCentreVille: boolean;
  tauxLogementsVacants?: number;
  terrainViabilise?: boolean;
  qualiteVoieDesserte: string;
  distanceAutoroute: string;
  distanceTransportCommun: string;
  proximiteCommercesServices: boolean;
  voieEauProximite?: string;
  distanceRaccordementElectrique: string;
  connectionReseauElectricite?: boolean;

  // Zonages et contraintes
  zonageReglementaire: string;
  presenceRisquesNaturels: string;
  presenceRisquesTechnologiques: boolean;
  zonagePatrimonial: string;

  // Qualités paysagères et architecturales
  qualitePaysage: string;
  valeurArchitecturaleHistorique: string;

  // Environnement et biodiversité
  couvertVegetal?: string;
  presenceEspeceProtegee?: string;
  zonageEnvironnemental: string;
  trameVerteEtBleue: string;
  zoneHumide?: string;

  // Optionnel
  coordonnees?: {
    latitude: number;
    longitude: number;
  };
}

export interface TestCaseExpectedUsage {
  usage: string;
  indiceMutabilite: number;
  rang: number;
}

export interface TestCaseExpected {
  usages: TestCaseExpectedUsage[];
  fiabilite: number;
  metadata: {
    criteresRenseignes: number;
    criteresTotal: number;
    criteresManquants: string[];
  };
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  source: string;
  algorithmVersion: string;
  input: TestCaseInput;
  expected: TestCaseExpected;
}
