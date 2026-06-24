import { EnrichissementOutputDto, MutabiliteOutputDto } from "@mutafriches/shared-types";
import { ParcelleUiModel } from "../types/parcelle.models";
import { STORAGE_KEYS } from "../config/storage-keys.config";

export interface FormState {
  // Étape 1 - Données d'enrichissement
  identifiantSite?: string;
  enrichmentData?: EnrichissementOutputDto;
  uiData?: ParcelleUiModel;

  // Étape 2 - Données manuelles
  manualData?: Record<string, string>;

  // Étape 3 - Résultats de mutabilité
  mutabilityResult?: MutabiliteOutputDto;

  // Métadonnées
  currentStep: number;
  completedSteps: number[];
}

export interface FormContextType {
  state: FormState;

  // Actions pour l'étape 1
  setEnrichmentData: (
    data: EnrichissementOutputDto,
    uiData: ParcelleUiModel,
    identifiant: string,
  ) => void;

  // Actions pour l'étape 2
  setManualData: (data: Record<string, string>) => void;

  // Actions pour l'étape 3
  setMutabilityResult: (result: MutabiliteOutputDto) => void;

  // Actions globales
  setCurrentStep: (step: number) => void;
  canAccessStep: (step: number) => boolean;
  resetForm: () => void;
}

export const STORAGE_KEY = STORAGE_KEYS.FORM_STATE;

export const initialState: FormState = {
  currentStep: 1,
  completedSteps: [],
};
