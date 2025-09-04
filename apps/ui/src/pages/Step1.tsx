import React, { useState } from "react";
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
import { useParcelles } from "../hooks/useParcelles";
import { Header } from "../components/common/Header";

export const Step1: React.FC = () => {
  const navigate = useNavigate();
  const [selectionMode, setSelectionMode] = useState<"id" | "carte">("id");
  const [isMultiParcelle, setIsMultiParcelle] = useState(false);

  // Utilisation du hook amélioré
  const { enrichmentData, enrichmentError, isLoading, enrichir, uiData } = useParcelles();

  // Fonction pour gérer la recherche par ID
  const handleSearchById = (identifiant: string) => {
    enrichir(identifiant);
  };

  // Fonction pour gérer la sélection depuis la carte
  const handleMapSelection = () => {
    // Simulation avec un ID fixe pour le moment
    // TODO: Récupérer le vrai ID depuis la carte
    const testParcelId = "50147000AR0010";
    enrichir(testParcelId);
  };

  // Navigation vers l'étape suivante
  const handleNext = () => {
    if (!enrichmentData) {
      return;
    }

    // Passer les données à l'étape suivante
    navigate("/step2", {
      state: {
        enrichmentData,
        identifiantParcelle: enrichmentData.identifiantParcelle,
      },
    });
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

        {/* Choix du mode de sélection et multi-parcelle */}
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

        {/* États de chargement et erreur */}
        {isLoading && (
          <LoadingCallout
            title="Enrichissement en cours"
            message="Récupération des informations de la parcelle..."
          />
        )}

        {enrichmentError && !isLoading && <ErrorAlert message={enrichmentError} />}

        {/* Affichage des données enrichies */}
        <EnrichmentDisplay
          data={uiData}
          sources={enrichmentData?.sourcesUtilisees}
          fiabilite={enrichmentData?.fiabilite}
        />

        {/* Boutons de navigation */}
        <div className="fr-mt-4w" style={{ textAlign: "right" }}>
          <button className="fr-btn" onClick={handleNext} disabled={!enrichmentData || isLoading}>
            Suivant
            <span className="fr-icon-arrow-right-s-line fr-icon--sm" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </BaseLayout>
  );
};
