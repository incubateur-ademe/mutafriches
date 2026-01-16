import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../../shared/components/layout/Layout";
import { ROUTES } from "../../../shared/config/routes.config";
import { MultiParcelleToggle } from "../components/MultiParcelleToggle";
import { ParcelleSelectionMap } from "../components/parcelle-map/ParcelleSelectionMap";
import { MutabilityAccordion } from "../components/MutabilityAccordion";
import { useFormContext } from "../../../shared/form/useFormContext";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { resetForm, state } = useFormContext();

  const [isMultiParcelle, setIsMultiParcelle] = useState(false);

  const handleAnalyze = async (identifiant: string) => {
    // Reset le formulaire si on recommence une analyse
    if (state.enrichmentData) {
      resetForm();
    }

    // Naviguer vers la page d'enrichissement (loading)
    navigate(ROUTES.ENRICHISSEMENT, { state: { identifiant } });
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
                navigate(ROUTES.QUALIFICATION_SITE);
              }}
            >
              Continuer l'analyse
            </button>
            <button
              className="fr-btn fr-btn--secondary fr-ml-2w"
              onClick={() => {
                resetForm();
              }}
            >
              Recommencer
            </button>
          </div>
        </div>
      )}

      <div className="fr-mt-6w fr-mb-4w">
        <h1>Trouver le bon usage pour une friche</h1>

        <p className="fr-text--lead">
          <strong>Pour demarrer l'analyse de l'usage le plus adapte a votre site en friche,</strong>{" "}
          selectionner une parcelle sur la carte. Vous pouvez la rechercher en entrant son adresse
          exacte ou une adresse approchante.
          <br />
          Selectionner la parcelle et cliquer sur 'Analyser cette parcelle'.
        </p>

        <MultiParcelleToggle isMulti={isMultiParcelle} onChange={setIsMultiParcelle} />

        <ParcelleSelectionMap onAnalyze={handleAnalyze} height="500px" />

        <MutabilityAccordion />
      </div>
    </Layout>
  );
};
