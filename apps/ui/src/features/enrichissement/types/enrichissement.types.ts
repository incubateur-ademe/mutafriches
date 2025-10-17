export interface ParcelleSelectionState {
  selectedParcelle: string | null;
  isMultiParcelle: boolean;
}

export interface EnrichmentDisplayProps {
  data: unknown;
  isLoading: boolean;
}
