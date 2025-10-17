import React, { useState, useEffect, ReactNode, useRef } from "react";
import { FormContext } from "./FormContext";
import { FormState, FormContextType, STORAGE_KEY, initialState } from "./FormContext.types";
import { EnrichissementOutputDto, MutabiliteOutputDto } from "@mutafriches/shared-types";
import { ROUTES } from "../config/routes.config";
import { ParcelleUiModel } from "../types/parcelle.models";

const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

export const FormProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FormState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Vérifier si la session n'est pas expirée
      if (data.timestamp && Date.now() - data.timestamp < SESSION_DURATION) {
        return data;
      }
      // Session expirée, nettoyer
      localStorage.removeItem(STORAGE_KEY);
    }
    return initialState;
  });

  // Utiliser useRef pour éviter la sauvegarde au premier render
  const isFirstRender = useRef(true);

  // Sauvegarder dans localStorage à chaque changement SAUF au premier render
  // On ajoute un timestamp pour gérer l'expiration
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        timestamp: Date.now(),
      }),
    );
  }, [state]);

  // Gestion du reset du formulaire si on arrive sur la home
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath === ROUTES.HOME || currentPath === ROUTES.STEP1) {
      const hasData = localStorage.getItem(STORAGE_KEY);
      if (hasData) {
        const stored = JSON.parse(hasData) as { completedSteps?: number[]; timestamp?: number };
        if (stored.completedSteps && stored.completedSteps.length > 0) {
          // Il y a des données en cours, ne pas reset automatiquement
          return;
        }
      }
    }
  }, []);

  const setEnrichmentData = (
    data: EnrichissementOutputDto,
    uiData: ParcelleUiModel,
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

  const setMutabilityResult = (result: MutabiliteOutputDto) => {
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
