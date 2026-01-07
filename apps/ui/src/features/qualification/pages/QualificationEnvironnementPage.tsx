import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../shared/config/routes.config";
import { Stepper } from "../../../shared/components/layout";
import { Layout } from "../../../shared/components/layout/Layout";
import { useFormContext } from "../../../shared/form/useFormContext";
import { useEventTracking } from "../../../shared/hooks/useEventTracking";
import { TypeEvenement } from "@mutafriches/shared-types";
import { EnvironnementEnrichedData } from "../components/environnement/EnvironnementEnrichedData";
import { EnvironnementManualForm } from "../components/environnement/EnvironnementManualForm";
import { StepNavigation } from "../components/common/StepNavigation";
import { EnvironnementFormValues } from "../config/types";

export const QualificationEnvironnementPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, setManualData, setCurrentStep, canAccessStep } = useFormContext();
  const { track } = useEventTracking();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verifier l'acces a cette etape
  useEffect(() => {
    if (!canAccessStep(2)) {
      navigate(ROUTES.QUALIFICATION_SITE);
      return;
    }
    setCurrentStep(2);
  }, [canAccessStep, navigate, setCurrentStep]);

  const handleSubmit = async (values: EnvironnementFormValues) => {
    setIsSubmitting(true);

    try {
      // Fusionner avec les donnees manuelles existantes
      const updatedManualData = {
        ...state.manualData,
        ...values,
      };

      // Sauvegarder les donnees dans le contexte
      setManualData(updatedManualData);

      // Tracker l'evenement de saisie des donnees complementaires
      const dataRecord = updatedManualData as Record<string, string>;
      await track(TypeEvenement.DONNEES_COMPLEMENTAIRES_SAISIES, {
        identifiantCadastral: state.identifiantParcelle || undefined,
        donnees: {
          nombreChampsSaisis: Object.keys(dataRecord).filter(
            (k) => dataRecord[k] && dataRecord[k] !== "",
          ).length,
        },
      });

      // Passer a l'etape suivante
      navigate(ROUTES.QUALIFICATION_RISQUES);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    navigate(ROUTES.QUALIFICATION_SITE);
  };

  // Si pas d'acces, ne rien afficher (la redirection se fait dans useEffect)
  if (!canAccessStep(2)) {
    return null;
  }

  // Extraire les valeurs initiales du formulaire environnement depuis manualData
  const initialEnvironnementValues: Partial<EnvironnementFormValues> = {
    qualitePaysage:
      (state.manualData?.qualitePaysage as EnvironnementFormValues["qualitePaysage"]) || "",
    qualiteVoieDesserte:
      (state.manualData?.qualiteVoieDesserte as EnvironnementFormValues["qualiteVoieDesserte"]) ||
      "",
  };

  return (
    <Layout>
      <Stepper
        currentStep={2}
        totalSteps={3}
        currentStepTitle="Environnement du site"
        nextStepTitle="Risques identifies"
      />

      <div className="fr-mb-4w">
        <h1>Environnement du site</h1>
        <p className="fr-text--lead">
          Voici les informations sur l'environnement de votre parcelle. Completez les informations
          manquantes pour ameliorer la precision de l'analyse.
        </p>

        {/* Donnees enrichies (lecture seule) */}
        {state.uiData && <EnvironnementEnrichedData data={state.uiData} />}

        <hr className="fr-mt-4w fr-mb-4w" />

        {/* Formulaire de saisie manuelle */}
        <EnvironnementManualForm
          initialValues={initialEnvironnementValues}
          onSubmit={handleSubmit}
          formId="environnement-form"
        />

        {/* Boutons de navigation */}
        <StepNavigation
          onPrevious={handlePrevious}
          previousLabel="Precedent"
          nextLabel="Continuer"
          nextType="submit"
          formId="environnement-form"
          isLoading={isSubmitting}
        />
      </div>
    </Layout>
  );
};
