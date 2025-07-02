export interface Component {
  name: string;
  data: Record<string, any>;
}

export interface StepConfig {
  title: string;
  nextTitle: string;
  component: string;
}

export interface FormData {
  // Données de l'étape 1
  parcelSelected?: boolean;
  parcelInfo?: {
    nom: string;
    commune: string;
    surfaceParcelle: string;
    surfaceBatie: string;
    typeProprietaire: string;
    ancienneActivite: string;
  };

  // Données automatiques étape 2
  autoData?: {
    surfaceParcelle: string;
    surfaceBatie: string;
    typeProprietaire: string;
    ancienneActivite: string;
    centreVille: string;
    distanceAutoroute: string;
    distanceTrain: string;
    proximiteCommerces: string;
    distanceRaccordement: string;
    tauxLV: string;
    risquesTechno: string;
    risquesNaturels: string;
    potentielEcologique: string;
    zonageEnviro: string;
    zonageUrba: string;
    zonagePatrimonial: string;
    tvb: string;
  };

  // Données manuelles étape 3
  manualData?: {
    terrainViabilise: string;
    etatBati: string;
    presencePollution: string;
    qualitePatrimoniale: string;
    qualitePaysagere: string;
    qualiteDesserte: string;
    commentaires?: string;
  };

  // Résultats étape 4
  results?: {
    usages: UsageResult[];
    fiabilite: number;
  };
}

export interface UsageResult {
  usage: string;
  indice: number;
  classement: number;
  potentiel:
    | 'Très favorable'
    | 'Favorable'
    | 'Modéré'
    | 'Peu favorable'
    | 'Défavorable';
}

export interface StepData {
  currentStep: number;
  totalSteps: number;
  showPrevious: boolean;
  showNext: boolean;
  previousStep: number;
  nextStep: number;
}

export interface StepConfigMap {
  [key: number]: StepConfig;
}

export interface MockDataResponse {
  [key: string]: string | number | UsageResult[] | undefined;
}
