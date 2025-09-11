import React, { useState, useEffect, ReactNode, useRef } from "react";
import { FormContext } from "./FormContext";
import { FormState, FormContextType, STORAGE_KEY, initialState } from "./FormContext.types";
import { EnrichmentResultDto, MutabilityResultDto, UiParcelleDto } from "@mutafriches/shared-types";

export const FormProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FormState>(() => {
    // Charger depuis localStorage au montage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as FormState;
      } catch (e) {
        console.error("Erreur lors du chargement du localStorage:", e);
      }
    }
    return initialState;
  });

  // Utiliser useRef pour éviter la sauvegarde au premier render
  const isFirstRender = useRef(true);

  // Sauvegarder dans localStorage à chaque changement SAUF au premier render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setEnrichmentData = (
    data: EnrichmentResultDto,
    uiData: UiParcelleDto,
    identifiant: string,
  ) => {
    setState((prev) => ({
      ...prev,
      enrichmentData: data,
      uiData: uiData,
      identifiantParcelle: identifiant,
      completedSteps: [...new Set([...prev.completedSteps, 1])],
    }));
  };

  const setManualData = (data: Record<string, string>) => {
    setState((prev) => ({
      ...prev,
      manualData: data,
      completedSteps: [...new Set([...prev.completedSteps, 2])],
    }));
  };

  const setMutabilityResult = (result: MutabilityResultDto) => {
    setState((prev) => ({
      ...prev,
      mutabilityResult: result,
      completedSteps: [...new Set([...prev.completedSteps, 3])],
    }));
  };

  const setCurrentStep = (step: number) => {
    setState((prev) => {
      // Ne mettre à jour que si l'étape a changé
      if (prev.currentStep === step) {
        return prev;
      }
      return {
        ...prev,
        currentStep: step,
      };
    });
  };

  const canAccessStep = (step: number): boolean => {
    if (step === 1) return true;
    if (step === 2) return state.completedSteps.includes(1);
    if (step === 3) return state.completedSteps.includes(1) && state.completedSteps.includes(2);
    return false;
  };

  const resetForm = () => {
    setState(initialState);
    localStorage.removeItem(STORAGE_KEY);
  };

  const contextValue: FormContextType = {
    state,
    setEnrichmentData,
    setManualData,
    setMutabilityResult,
    setCurrentStep,
    canAccessStep,
    resetForm,
  };

  return <FormContext.Provider value={contextValue}>{children}</FormContext.Provider>;
};
