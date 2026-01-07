import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../shared/config/routes.config";
import { Stepper } from "../../../shared/components/layout";
import { Layout } from "../../../shared/components/layout/Layout";
import { useFormContext } from "../../../shared/form/useFormContext";
import { SiteEnrichedData } from "../components/site/SiteEnrichedData";
import { SiteManualForm } from "../components/site/SiteManualForm";
import { StepNavigation } from "../components/common/StepNavigation";
import { SiteFormValues } from "../config/types";

export const QualificationSitePage: React.FC = () => {
  const navigate = useNavigate();
  const { state, setManualData, setCurrentStep, canAccessStep } = useFormContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verifier l'acces a cette etape
  useEffect(() => {
    if (!canAccessStep(1)) {
      navigate(ROUTES.HOME);
      return;
    }
    setCurrentStep(1);
  }, [canAccessStep, navigate, setCurrentStep]);

  const handleSubmit = (values: SiteFormValues) => {
    setIsSubmitting(true);

    // Fusionner avec les donnees manuelles existantes
    const updatedManualData = {
      ...state.manualData,
      ...values,
    };

    // Sauvegarder les donnees dans le contexte
    setManualData(updatedManualData);

    // Passer a l'etape suivante
    navigate(ROUTES.QUALIFICATION_ENVIRONNEMENT);
  };

  const handlePrevious = () => {
    navigate(ROUTES.HOME);
  };

  // Si pas d'acces, ne rien afficher (la redirection se fait dans useEffect)
  if (!canAccessStep(1)) {
    return null;
  }

  // Extraire les valeurs initiales du formulaire site depuis manualData
  const initialSiteValues: Partial<SiteFormValues> = {
    typeProprietaire:
      (state.manualData?.typeProprietaire as SiteFormValues["typeProprietaire"]) || "",
    raccordementEau:
      (state.manualData?.raccordementEau as SiteFormValues["raccordementEau"]) || "",
    etatBatiInfrastructure:
      (state.manualData?.etatBatiInfrastructure as SiteFormValues["etatBatiInfrastructure"]) || "",
    presencePollution:
      (state.manualData?.presencePollution as SiteFormValues["presencePollution"]) || "",
    valeurArchitecturaleHistorique:
      (state.manualData
        ?.valeurArchitecturaleHistorique as SiteFormValues["valeurArchitecturaleHistorique"]) || "",
    trameVerteEtBleue:
      (state.manualData?.trameVerteEtBleue as SiteFormValues["trameVerteEtBleue"]) || "",
  };

  return (
    <Layout>
      <Stepper
        currentStep={1}
        totalSteps={3}
        currentStepTitle="Caracteristiques du site"
        nextStepTitle="Environnement du site"
      />

      <div className="fr-mb-4w">
        <h1>Caracteristiques du site</h1>
        <p className="fr-text--lead">
          Voici les informations que nous avons collectees sur votre parcelle. Verifiez-les et
          completez les informations manquantes.
        </p>

        {/* Donnees enrichies (lecture seule) */}
        {state.uiData && <SiteEnrichedData data={state.uiData} />}

        <hr className="fr-mt-4w fr-mb-4w" />

        {/* Formulaire de saisie manuelle */}
        <SiteManualForm
          initialValues={initialSiteValues}
          onSubmit={handleSubmit}
          formId="site-form"
        />

        {/* Boutons de navigation */}
        <StepNavigation
          onPrevious={handlePrevious}
          previousLabel="Retour a l'accueil"
          nextLabel="Continuer"
          nextType="submit"
          formId="site-form"
          isLoading={isSubmitting}
        />
      </div>
    </Layout>
  );
};
