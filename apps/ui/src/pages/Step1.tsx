import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BaseLayout } from "../layouts/BaseLayout";
import { useFormContext } from "../context/useFormContext";
import { apiService } from "../services/api/api.service";
import { ROUTES } from "../config/routes/routes.config";
import { Header } from "../components/layout/Header";
import { Stepper } from "../components/layout/Stepper";
import { SelectParcelleByMap } from "../components/step1/parcelle-selection/SelectParcelleByMap";
import { LoadingCallout } from "../components/common/LoadingCallout";
import { SelectParcelleById } from "../components/step1/parcelle-selection/SelectParcelleById";
import { SelectionParcelleMode } from "../components/step1/parcelle-selection/SelectionParcelleMode";
import { MultiParcelleToggle } from "../components/step1/parcelle-selection/MultiParcelleToggle";
import { ErrorAlert } from "../components/common/ErrorAlert";
import { EnrichmentDisplayZone } from "../components/step1/enrichment-display/EnrichmentDisplayZone";
import { transformEnrichmentToUiData } from "../utils/mappers/enrichissment.mapper";

export const Step1: React.FC = () => {
  const navigate = useNavigate();
  const { state, setEnrichmentData, setCurrentStep } = useFormContext();

  const [selectionMode, setSelectionMode] = useState<"id" | "carte">("id");
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
      const enrichmentResult = await apiService.enrichirParcelle(identifiant);
      const uiData = transformEnrichmentToUiData(enrichmentResult);
      setEnrichmentData(enrichmentResult, uiData, identifiant);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers pour les différents modes de sélection
  const handleSearchById = (identifiant: string) => {
    handleEnrichir(identifiant);
  };

  const handleMapSelection = () => {
    const testParcelId = "50147000AR0010";
    handleEnrichir(testParcelId);
  };

  // Navigation vers l'étape suivante
  const handleNext = () => {
    if (!state.enrichmentData) {
      setError("Veuillez d'abord enrichir une parcelle");
      return;
    }
    navigate(ROUTES.STEP2);
  };

  return (
    <BaseLayout>
      <Header />
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
          <div className="fr-col-12 fr-col-md-8">
            <SelectionParcelleMode mode={selectionMode} onChange={setSelectionMode} />
          </div>
          <div className="fr-col-12 fr-col-md-4">
            <MultiParcelleToggle isMulti={isMultiParcelle} onChange={setIsMultiParcelle} />
          </div>
        </div>

        {/* Mode de sélection actif */}
        {selectionMode === "id" ? (
          <SelectParcelleById onSearch={handleSearchById} />
        ) : (
          <SelectParcelleByMap onSelect={handleMapSelection} />
        )}

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
    </BaseLayout>
  );
};
