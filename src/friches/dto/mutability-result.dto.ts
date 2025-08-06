export interface UsageResultDto {
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

export interface MutabilityResultDto {
  fiabilite: {
    note: number;
    text: string;
    description: string;
  };
  resultats: UsageResultDto[];
}
