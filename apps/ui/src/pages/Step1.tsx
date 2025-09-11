import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BaseLayout } from "../layouts/BaseLayout";
import { Stepper } from "../components/common/Stepper";
import { IdMode } from "../components/parcelle/IdMode";
import { MapMode } from "../components/parcelle/MapMode";
import { SelectionMode } from "../components/parcelle/SelectionMode";
import { MultiParcelleToggle } from "../components/parcelle/MultiParcelleToggle";
import { EnrichmentDisplay } from "../components/parcelle/EnrichmentDisplay";
import { LoadingCallout } from "../components/ui/LoadingCallout";
import { ErrorAlert } from "../components/ui/ErrorAlert";
import { Header } from "../components/common/Header";
import { useFormContext } from "../context/useFormContext";
import { apiService } from "../services/api/api.service";
import { transformToUiData } from "../services/mappers/ui.transformer";

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
      const uiData = transformToUiData(enrichmentResult);
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
    navigate("/step2");
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
            <SelectionMode mode={selectionMode} onChange={setSelectionMode} />
          </div>
          <div className="fr-col-12 fr-col-md-4">
            <MultiParcelleToggle isMulti={isMultiParcelle} onChange={setIsMultiParcelle} />
          </div>
        </div>

        {/* Mode de sélection actif */}
        {selectionMode === "id" ? (
          <IdMode onSearch={handleSearchById} />
        ) : (
          <MapMode onSelect={handleMapSelection} />
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
        {state.uiData && <EnrichmentDisplay data={state.uiData} />}

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
