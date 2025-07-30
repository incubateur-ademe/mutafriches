export interface MockInfosParcelle {
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
  potentielEcologique: string;
}

export interface ResultatUsage {
  rang: number;
  usage: string;
  explication: string;
  indiceMutabilite: number;
  potentiel:
    | 'Très favorable'
    | 'Favorable'
    | 'Modéré'
    | 'Peu favorable'
    | 'Défavorable';
}

export interface MockResultatsMutabilite {
  fiabilite: {
    note: number;
    text: string;
    description: string;
  };
  resultats: ResultatUsage[];
}

export type MockData = MockInfosParcelle | MockResultatsMutabilite | undefined;
