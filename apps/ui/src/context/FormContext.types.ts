import { EnrichmentResultDto, UiParcelleDto, MutabilityResultDto } from "@mutafriches/shared-types";

export interface FormState {
  // Étape 1 - Données d'enrichissement
  identifiantParcelle?: string;
  enrichmentData?: EnrichmentResultDto;
  uiData?: UiParcelleDto;

  // Étape 2 - Données manuelles
  manualData?: Record<string, string>;

  // Étape 3 - Résultats de mutabilité
  mutabilityResult?: MutabilityResultDto;

  // Métadonnées
  currentStep: number;
  completedSteps: number[];
}

export interface FormContextType {
  state: FormState;

  // Actions pour l'étape 1
  setEnrichmentData: (
    data: EnrichmentResultDto,
    uiData: UiParcelleDto,
    identifiant: string,
  ) => void;

  // Actions pour l'étape 2
  setManualData: (data: Record<string, string>) => void;

  // Actions pour l'étape 3
  setMutabilityResult: (result: MutabilityResultDto) => void;

  // Actions globales
  setCurrentStep: (step: number) => void;
  canAccessStep: (step: number) => boolean;
  resetForm: () => void;
}

export const STORAGE_KEY = "mutafriches-form-state";

export const initialState: FormState = {
  currentStep: 1,
  completedSteps: [],
};
