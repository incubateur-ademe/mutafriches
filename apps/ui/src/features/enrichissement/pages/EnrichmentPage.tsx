import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStepRoute, ROUTES } from "../../../shared/config/routes.config";
import { Layout } from "../../../shared/components/layout/Layout";
import { Stepper } from "../../../shared/components/layout";
import { MultiParcelleToggle } from "../components/parcelle-selection/MultiParcelleToggle";
import { ParcelleSelection } from "../components/parcelle-selection/ParcelleSelection";
import { LoadingCallout } from "../../../shared/components/common/LoadingCallout";
import { ErrorAlert } from "../../../shared/components/common/ErrorAlert";
import { EnrichmentDisplayZone } from "../components/enrichment-display/EnrichmentDisplayZone";
import { transformEnrichmentToUiData } from "../utils/enrichissment.mapper";
import { useFormContext } from "../../../shared/form/useFormContext";
import { frichesService } from "../../../shared/services/api/api.friches.service";

export const Step1: React.FC = () => {
  const navigate = useNavigate();
  const { state, setEnrichmentData, setCurrentStep, resetForm } = useFormContext();

  const [isMultiParcelle, setIsMultiParcelle] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mettre à jour l'étape courante au montage
  useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  // Fonction principale d'enrichissement
  const handleEnrichir = async (identifiant: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const enrichmentResult = await frichesService.enrichirParcelle(identifiant);
      const uiData = transformEnrichmentToUiData(enrichmentResult);
      setEnrichmentData(enrichmentResult, uiData, identifiant);

      // Scroll vers les résultats après succès
      scrollToEnrichmentZone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation vers l'étape suivante
  const handleNext = () => {
    if (!state.enrichmentData) {
      setError("Veuillez d'abord enrichir une parcelle");
      return;
    }
    navigate(ROUTES.STEP2);
  };

  // Scroll vers la zone d'affichage des données enrichies
  const scrollToEnrichmentZone = () => {
    setTimeout(() => {
      const element = document.getElementById("enrichment-display-zone");
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }
    }, 100); // Petit délai pour laisser le DOM se mettre à jour
  };

  return (
    <Layout showSimpleHeader={true}>
      {/* Si des données existent, proposer de continuer ou recommencer */}
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
        currentStepTitle="Votre site en friche"
        nextStepTitle="Données complémentaires"
      />

      <div className="fr-mb-4w">
        <h3>Sélectionnez la (les) parcelle(s) concernée(s)</h3>

        {/* Contrôles de sélection */}
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-4">
            <MultiParcelleToggle isMulti={isMultiParcelle} onChange={setIsMultiParcelle} />
          </div>
        </div>

        <ParcelleSelection onAnalyze={handleEnrichir} />

        {/* États de l'interface */}
        {isLoading && (
          <LoadingCallout
            title="Enrichissement en cours"
            message="Récupération des informations de la parcelle..."
          />
        )}

        {error && !isLoading && <ErrorAlert message={error} />}

        {/* Affichage des données enrichies */}
        {state.uiData && <EnrichmentDisplayZone data={state.uiData} />}

        {/* Navigation */}
        <div className="fr-mt-4w" style={{ textAlign: "right" }}>
          <button
            className="fr-btn"
            onClick={handleNext}
            disabled={!state.enrichmentData || isLoading}
          >
            Suivant
            <span className="fr-icon-arrow-right-s-line fr-icon--sm" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </Layout>
  );
};
