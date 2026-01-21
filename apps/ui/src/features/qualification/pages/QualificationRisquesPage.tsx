import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../shared/config/routes.config";
import { Stepper } from "../../../shared/components/layout";
import { Layout } from "../../../shared/components/layout/Layout";
import { useFormContext } from "../../../shared/form/useFormContext";
import { useEventTracking } from "../../../shared/hooks/useEventTracking";
import { TypeEvenement } from "@mutafriches/shared-types";
import { EnrichedInfoField, StepNavigation } from "../components";

export const QualificationRisquesPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, setCurrentStep, canAccessStep } = useFormContext();
  const { track } = useEventTracking();
  const hasTrackedVisit = useRef(false);

  // Vérifier l'accès à cette étape
  useEffect(() => {
    if (!canAccessStep(3)) {
      navigate(ROUTES.QUALIFICATION_ENVIRONNEMENT);
      return;
    }
    setCurrentStep(3);

    // Tracker l'arrivée sur la page
    if (!hasTrackedVisit.current) {
      hasTrackedVisit.current = true;
      track(TypeEvenement.QUALIFICATION_RISQUES, {
        identifiantCadastral: state.identifiantParcelle || undefined,
      });
    }
  }, [canAccessStep, navigate, setCurrentStep, track, state.identifiantParcelle]);

  const handlePrevious = () => {
    navigate(ROUTES.QUALIFICATION_ENVIRONNEMENT);
  };

  const handleNext = () => {
    navigate(ROUTES.RESULTATS);
  };

  // Si pas d'accès, ne rien afficher (la redirection se fait dans useEffect)
  if (!canAccessStep(3)) {
    return null;
  }

  const uiData = state.uiData;

  return (
    <Layout>
      <Stepper
        currentStep={3}
        totalSteps={3}
        currentStepTitle="Qualifier les risques et zonages du site"
        nextStepTitle="Analyse de mutabilité"
      />

      {/* Zone 1 - Risques technologiques et naturels */}
      <div className="fr-grid-row fr-grid-row--gutters">
        <EnrichedInfoField
          id="presence-risques-technologiques"
          label="Présence de risques technologiques"
          value={uiData?.risquesTechno}
          tooltip={
            <>
              Récupéré depuis les données de l'API GéoRisques :<br />
              <a
                href="https://georisques.gouv.fr/doc-api"
                target="_blank"
                rel="noopener noreferrer"
                className="fr-link fr-text--xs"
              >
                georisques.gouv.fr/doc-api
              </a>
            </>
          }
        />

        <EnrichedInfoField
          id="niveau-risques-naturels"
          label="Niveau de risques naturels"
          value={uiData?.risquesNaturels}
          tooltip={
            <>
              Récupéré depuis les données de l'API GéoRisques :<br />
              <a
                href="https://www.georisques.gouv.fr/citoyen-recherche-map"
                target="_blank"
                rel="noopener noreferrer"
                className="fr-link fr-text--xs"
              >
                georisques.gouv.fr/citoyen-recherche-map
              </a>
              <br />
              <br />
              <em>
                En l'absence de la numérisation des plans de prévention des risques, cette donnée
                est susceptible d'être faussée
              </em>
            </>
          }
        />
      </div>

      <hr className="fr-my-4w" />

      {/* Zone 2 - Zonages environnemental et réglementaire */}
      <div className="fr-grid-row fr-grid-row--gutters">
        <EnrichedInfoField
          id="type-zonage-environnemental"
          label="Type de zonage environnemental"
          value={uiData?.zonageEnviro}
          tooltip={
            <>
              Données enrichies via les API Carto Nature et GPU de l'IGN :<br />
              <a
                href="https://apicarto.ign.fr/api/doc/"
                target="_blank"
                rel="noopener noreferrer"
                className="fr-link fr-text--xs"
              >
                apicarto.ign.fr/api/doc/
              </a>
            </>
          }
        />

        <EnrichedInfoField
          id="type-zonage-reglementaire"
          label="Type de zonage réglementaire"
          value={uiData?.zonageUrba}
          tooltip={
            <>
              Données enrichies via les API Carto Nature et GPU de l'IGN :<br />
              <a
                href="https://apicarto.ign.fr/api/doc/"
                target="_blank"
                rel="noopener noreferrer"
                className="fr-link fr-text--xs"
              >
                apicarto.ign.fr/api/doc/
              </a>
            </>
          }
        />
      </div>

      <hr className="fr-my-4w" />

      {/* Zone 3 - Zonage patrimonial */}
      <div className="fr-grid-row fr-grid-row--gutters fr-mb-8w">
        <EnrichedInfoField
          id="type-zonage-patrimonial"
          label="Type de zonage patrimonial"
          value={uiData?.zonagePatrimonial}
          tooltip={
            <>
              Données enrichies via les API Carto Nature et GPU de l'IGN :<br />
              <a
                href="https://apicarto.ign.fr/api/doc/"
                target="_blank"
                rel="noopener noreferrer"
                className="fr-link fr-text--xs"
              >
                apicarto.ign.fr/api/doc/
              </a>
            </>
          }
        />
      </div>

      <StepNavigation
        onPrevious={handlePrevious}
        onNext={handleNext}
        previousLabel="Précédent"
        nextLabel="Calculer la mutabilité"
      />
    </Layout>
  );
};
