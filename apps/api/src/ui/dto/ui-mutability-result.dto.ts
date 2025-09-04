export interface UiMutabilityResultDto {
  fiabilite: {
    note: number;
    text: string;
    description: string;
  };
  resultats: Array<{
    rang: number;
    usage: string;
    explication: string;
    indiceMutabilite: number;
    potentiel: string;
  }>;
}
