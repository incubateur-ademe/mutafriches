import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../shared/config/routes.config";
import { Stepper } from "../../../shared/components/layout";
import { Layout } from "../../../shared/components/layout/Layout";
import { useFormContext } from "../../../shared/form/useFormContext";
import { RisquesEnrichedData } from "../components/risques/RisquesEnrichedData";
import { StepNavigation } from "../components/common/StepNavigation";

export const QualificationRisquesPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, setCurrentStep, canAccessStep } = useFormContext();

  // Verifier l'acces a cette etape
  useEffect(() => {
    if (!canAccessStep(3)) {
      navigate(ROUTES.QUALIFICATION_ENVIRONNEMENT);
      return;
    }
    setCurrentStep(3);
  }, [canAccessStep, navigate, setCurrentStep]);

  const handlePrevious = () => {
    navigate(ROUTES.QUALIFICATION_ENVIRONNEMENT);
  };

  const handleNext = () => {
    navigate(ROUTES.RESULTATS);
  };

  // Si pas d'acces, ne rien afficher (la redirection se fait dans useEffect)
  if (!canAccessStep(3)) {
    return null;
  }

  return (
    <Layout>
      <Stepper
        currentStep={3}
        totalSteps={3}
        currentStepTitle="Risques identifies"
        nextStepTitle="Resultats"
      />

      <div className="fr-mb-4w">
        <h1>Risques identifies</h1>
        <p className="fr-text--lead">
          Voici les risques et zonages identifies sur votre parcelle. Ces informations sont prises
          en compte dans le calcul de mutabilite.
        </p>

        {/* Affichage des risques depuis les donnees enrichies */}
        {state.uiData && <RisquesEnrichedData data={state.uiData} />}

        <div className="fr-callout fr-callout--blue-ecume fr-mt-4w">
          <h3 className="fr-callout__title">Information</h3>
          <p className="fr-callout__text">
            Les risques et zonages sont des donnees collectees automatiquement. Elles sont prises en
            compte dans le calcul de mutabilite pour vous proposer les usages les plus adaptes a
            votre parcelle.
          </p>
        </div>

        {/* Boutons de navigation */}
        <StepNavigation
          onPrevious={handlePrevious}
          onNext={handleNext}
          previousLabel="Precedent"
          nextLabel="Calculer la mutabilite"
        />
      </div>
    </Layout>
  );
};
