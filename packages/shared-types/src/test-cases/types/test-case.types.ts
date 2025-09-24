// Types spécifiques pour les fichiers de test JSON

export interface TestCaseInput {
  // Champs informatifs (optionnels)
  nomSite?: string;
  identifiantsParcellaires?: string;
  nomProprietaire?: string;
  commune?: string;
  nombreBatiments?: number | null;

  // Identifiants (optionnels dans les tests)
  identifiantParcelle?: string;

  // Propriété et surfaces
  typeProprietaire: string;
  surfaceSite: number;
  surfaceBati?: number;

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
  distanceRaccordementElectrique: string;

  // Zonages et contraintes
  zonageReglementaire: string;
  presenceRisquesNaturels: string;
  presenceRisquesTechnologiques: boolean;
  zonagePatrimonial: string;

  // Qualités paysagères et architecturales
  qualitePaysage: string;
  valeurArchitecturaleHistorique: string;

  // Environnement et biodiversité
  zonageEnvironnemental: string;
  trameVerteEtBleu: string;

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
  // fiabilite supprimée
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
