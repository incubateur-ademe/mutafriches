import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStepRoute, ROUTES } from "../../../shared/config/routes.config";
import { Layout } from "../../../shared/components/layout/Layout";
import { Stepper } from "../../../shared/components/layout";
import { MultiParcelleToggle } from "../components/parcelle-selection/MultiParcelleToggle";
import { ParcelleSelection } from "../components/parcelle-selection/ParcelleSelection";
import { ErrorAlert } from "../../../shared/components/common/ErrorAlert";
import { EnrichmentDisplayZone } from "../components/enrichment-display/EnrichmentDisplayZone";
import { transformEnrichmentToUiData } from "../utils/enrichissment.mapper";
import { useFormContext } from "../../../shared/form/useFormContext";
import { enrichissementService } from "../../../shared/services/api/api.enrichissement.service";
import { TypeEvenement } from "@mutafriches/shared-types";
import { useEventTracking } from "../../../shared/hooks/useEventTracking";
import { EnrichmentLoadingCallout } from "../components/enrichment-display/EnrichmentLoadingCallout";
import { MutabilityCalloutInfo } from "../components/callout/MutabilityCalloutInfo";

const MIN_LOADING_TIME = 3000; // 3 secondes minimum

export const Step1EnrichmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, setEnrichmentData, setCurrentStep, resetForm } = useFormContext();
  const { track } = useEventTracking();

  const [isMultiParcelle, setIsMultiParcelle] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  const handleEnrichir = async (identifiant: string) => {
    setIsLoading(true);
    setError(null);
    scrollToResultsZone();

    const startTime = Date.now();

    try {
      const enrichmentResult = await enrichissementService.enrichirParcelle(identifiant);
      const uiData = transformEnrichmentToUiData(enrichmentResult);

      // Calculer le temps écoulé
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);

      // Attendre le temps restant pour atteindre 3 secondes minimum
      await new Promise((resolve) => setTimeout(resolve, remainingTime));

      setEnrichmentData(enrichmentResult, uiData, identifiant);

      // Tracker l'événement d'enrichissement terminé
      await track(TypeEvenement.ENRICHISSEMENT_TERMINE, {
        identifiantCadastral: identifiant,
      });
    } catch (err) {
      // Même en cas d'erreur, respecter le temps minimum
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
      await new Promise((resolve) => setTimeout(resolve, remainingTime));

      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (!state.enrichmentData) {
      setError("Veuillez d'abord enrichir une parcelle");
      return;
    }
    navigate(ROUTES.STEP2);
  };

  const scrollToResultsZone = () => {
    setTimeout(() => {
      const element = document.getElementById("results-zone");
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }
    }, 100);
  };

  return (
    <Layout>
      {state.completedSteps.length > 0 && (
        <div className="fr-alert fr-alert--info fr-mb-3w">
          <h3 className="fr-alert__title">Analyse en cours</h3>
          <p>Vous avez une analyse en cours. Voulez-vous continuer ou recommencer ?</p>
          <div className="fr-mt-2w">
            <button
              className="fr-btn"
              onClick={() => {
                const nextStep = Math.min(state.currentStep + 1, 3);
                navigate(getStepRoute(nextStep as 1 | 2 | 3));
              }}
            >
              Continuer l'analyse
            </button>
            <button
              className="fr-btn fr-btn--secondary fr-ml-2w"
              onClick={() => {
                resetForm();
                window.location.reload();
              }}
            >
              Recommencer
            </button>
          </div>
        </div>
      )}

      <Stepper
        currentStep={1}
        totalSteps={3}
        currentStepTitle="Sélectionner un site en friche"
        nextStepTitle="Qualifier le site"
      />

      <div className="fr-mb-4w">
        <h1>Sélectionner un site en friche</h1>

        <p className="fr-text--lead">
          Pour démarrer l’analyse de mutabilité pour votre site, sélectionner une parcelle sur la
          carte. Vous pouvez la rechercher en entrant son adresse exacte ou une adresse approchante.
          Sélectionner la parcelle et cliquer sur ‘Analyser cette parcelle’.
        </p>

        <MultiParcelleToggle isMulti={isMultiParcelle} onChange={setIsMultiParcelle} />

        <ParcelleSelection onAnalyze={handleEnrichir} />

        <div className="fr-mt-4w">
          <MutabilityCalloutInfo />
        </div>

        {/* Zone de résultats avec id fixe pour le scroll */}
        <div id="results-zone">
          {isLoading && <EnrichmentLoadingCallout />}

          {error && !isLoading && <ErrorAlert message={error} />}

          {state.uiData && (
            <EnrichmentDisplayZone
              data={state.uiData}
              onNext={handleNext}
              isLoadingNext={isLoading}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};
