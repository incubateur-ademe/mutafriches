import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PodiumCard } from "../components/step3/PodiumCard";
import { ReliabilityScore } from "../components/step3/ReliabilityScore";
import { useFormContext, useIframeCallback, useIsIframeMode, useIframe } from "../context";
import { apiService } from "../services/api/api.service";
import { ROUTES } from "../config/routes/routes.config";
import { MutabilityResultDto } from "@mutafriches/shared-types";
import { LoadingCallout } from "../components/common/LoadingCallout";
import { ErrorAlert } from "../components/common/ErrorAlert";
import { ResultsTable } from "../components/step3/ResultTable";
import { PartnerCard } from "../components/step3/PartnerCard";
import { buildMutabilityInput } from "../utils/mappers/mutability.mapper";
import { SimpleIframeLayout } from "../layouts";
import { SimpleHeader, Stepper } from "../components/layout";
import { createIframeCommunicator } from "../utils/iframe/iframeCommunication";

export const Step3: React.FC = () => {
  const navigate = useNavigate();
  const { state, setMutabilityResult, setCurrentStep, canAccessStep, resetForm } = useFormContext();

  // Hooks iframe
  const isIframeMode = useIsIframeMode();
  const { hasCallback, callbackUrl, callbackLabel } = useIframeCallback();
  const { parentOrigin, integrator } = useIframe();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutabilityData, setMutabilityData] = useState<MutabilityResultDto | null>(null);

  // Un seul ref pour tracker si on a déjà initialisé
  const hasInitializedRef = React.useRef(false);

  // Créer le communicator une seule fois
  const iframeCommunicator = React.useMemo(() => {
    if (isIframeMode && parentOrigin) {
      // Pour demo, permettre toutes les origines
      const target = integrator === "demo" ? "*" : parentOrigin;
      return createIframeCommunicator(target);
    }
    return null;
  }, [isIframeMode, parentOrigin, integrator]);

  // Fonction pour envoyer les messages iframe
  const sendIframeMessages = useCallback(
    (results: MutabilityResultDto) => {
      if (!isIframeMode || !iframeCommunicator) return;

      const formData = {
        enrichmentData: state.enrichmentData,
        manualData: state.manualData,
        identifiantParcelle: state.identifiantParcelle,
        uiData: state.uiData,
      };

      iframeCommunicator.sendCompleted(results, formData);
    },
    [
      isIframeMode,
      iframeCommunicator,
      state.enrichmentData,
      state.manualData,
      state.identifiantParcelle,
      state.uiData,
    ],
  );

  // Fonction pour calculer la mutabilité
  const calculateMutability = useCallback(async () => {
    if (!state.enrichmentData || !state.manualData) {
      setError("Données manquantes pour le calcul");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const mutabilityInput = buildMutabilityInput(state.enrichmentData, state.manualData);
      const result = await apiService.calculerMutabilite(mutabilityInput);
      setMutabilityResult(result);
      setMutabilityData(result);
      sendIframeMessages(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur lors du calcul de mutabilité";
      setError(errorMessage);

      if (isIframeMode && iframeCommunicator) {
        iframeCommunicator.sendError(errorMessage, "MUTABILITY_CALCULATION_ERROR");
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    state.enrichmentData,
    state.manualData,
    setMutabilityResult,
    sendIframeMessages,
    isIframeMode,
    iframeCommunicator,
  ]);

  // useEffect principal pour l'initialisation
  useEffect(() => {
    // Protection contre les réexécutions
    if (hasInitializedRef.current) return;

    if (!canAccessStep(3)) {
      navigate(ROUTES.STEP2);
      return;
    }

    hasInitializedRef.current = true;
    setCurrentStep(3);

    // Gestion des données
    if (state.mutabilityResult) {
      // On a déjà les résultats
      setMutabilityData(state.mutabilityResult);
      sendIframeMessages(state.mutabilityResult);
    } else {
      // On doit calculer
      calculateMutability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Vide volontairement - on utilise hasInitializedRef pour la protection

  // Handler pour exporter les résultats
  const handleExport = () => {
    alert("Fonctionnalité d'export à venir ! Les résultats seront exportés en PDF.");
  };

  // Handler pour nouvelle analyse
  const handleNewAnalysis = () => {
    if (
      confirm(
        "Voulez-vous vraiment démarrer une nouvelle analyse ? Les données actuelles seront perdues.",
      )
    ) {
      resetForm();
      navigate(ROUTES.STEP1);
    }
  };

  // Handler pour modifier les données
  const handleModifyData = () => {
    navigate(ROUTES.STEP2);
  };

  // Handler pour le bouton callback
  const handleCallback = () => {
    if (callbackUrl) {
      window.open(callbackUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Si pas d'accès, ne rien afficher
  if (!canAccessStep(3)) {
    return null;
  }

  return (
    <SimpleIframeLayout>
      <SimpleHeader />
      <Stepper
        currentStep={3}
        totalSteps={3}
        currentStepTitle="Usages les plus appropriés"
        nextStepTitle="Analyse terminée"
      />

      <div className="fr-mb-4w">
        <h3>Consultez les usages les plus appropriés à votre site</h3>
        <p className="fr-text--sm">
          Au regard des caractéristiques sourcées et renseignées, vous trouverez les usages les plus
          pertinents pour votre site.
        </p>

        {/* États de chargement et erreur */}
        {isLoading && (
          <LoadingCallout
            title="Calcul en cours"
            message="Analyse de la mutabilité de votre friche..."
          />
        )}

        {error && !isLoading && <ErrorAlert message={error} />}

        {/* Résultats */}
        {mutabilityData && !isLoading && (
          <>
            {/* Header avec bouton export */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h4 className="fr-mb-0 fr-mt-4w">Podium des usages recommandés</h4>
              <button
                className="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-download-line fr-btn--sm"
                onClick={handleExport}
              >
                Exporter les résultats
              </button>
            </div>

            {/* Podium - Top 3 */}
            <div className="fr-grid-row fr-grid-row--gutters fr-mb-4w">
              {mutabilityData.resultats.slice(0, 3).map((result, index) => (
                <PodiumCard
                  key={result.usage}
                  result={result}
                  position={(index + 1) as 1 | 2 | 3}
                />
              ))}
            </div>

            {/* Question pertinence */}
            <div
              className="fr-mt-4w fr-mb-4w"
              style={{ display: "flex", justifyContent: "center" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <p className="fr-text--sm" style={{ margin: 0, fontWeight: "normal" }}>
                  Ce classement vous semble-t-il pertinent ?
                </p>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div className="fr-radio-group fr-radio-group--sm" style={{ margin: 0 }}>
                    <input type="radio" id="radio-pertinent-oui" name="pertinence" />
                    <label
                      className="fr-label fr-text--sm"
                      htmlFor="radio-pertinent-oui"
                      style={{ margin: 0 }}
                    >
                      Oui
                    </label>
                  </div>
                  <div className="fr-radio-group fr-radio-group--sm" style={{ margin: 0 }}>
                    <input type="radio" id="radio-pertinent-non" name="pertinence" />
                    <label
                      className="fr-label fr-text--sm"
                      htmlFor="radio-pertinent-non"
                      style={{ margin: 0 }}
                    >
                      Non
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Score de fiabilité */}
            <ReliabilityScore
              note={mutabilityData.fiabilite.note}
              text={mutabilityData.fiabilite.text}
              description={mutabilityData.fiabilite.description}
            />

            {/* Tableau complet */}
            <ResultsTable results={mutabilityData.resultats} />

            {/* Section outils et services */}
            <div className="fr-accordions-group fr-mt-4w">
              <section className="fr-accordion">
                <h4 className="fr-accordion__title">
                  <button className="fr-accordion__btn" aria-expanded="false" aria-controls="tools">
                    Des outils et services pour aller plus loin
                  </button>
                </h4>
                <div className="fr-collapse" id="tools">
                  <div className="fr-grid-row fr-grid-row--gutters">
                    <PartnerCard
                      logo="/images/logo-urbanvitaliz.svg"
                      logoAlt="Logo Urban Vitaliz"
                      title="Urban Vitaliz"
                      description="Pour être accompagné dans votre projet de réhabilitation par des conseillers compétents."
                      url="https://urbanvitaliz.fr"
                    />

                    <PartnerCard
                      logo="/images/logo-cartofriches.svg"
                      logoAlt="Logo Cartofriches"
                      title="Cartofriches"
                      description="Rendez votre friche visible sur l'inventaire national pour la rendre trouvable par des porteurs de projet."
                      url="https://cartofriches.cerema.fr"
                    />
                  </div>
                </div>
              </section>
            </div>
          </>
        )}

        {/* Boutons de navigation */}
        <div className="fr-mt-4w" style={{ textAlign: "center" }}>
          <button
            className="fr-btn fr-btn--secondary"
            onClick={handleModifyData}
            disabled={isLoading}
          >
            <span className="fr-icon-arrow-left-s-line fr-icon--sm" aria-hidden="true"></span>
            Modifier les données
          </button>

          {/* Bouton Nouvelle analyse - uniquement si pas de callback */}
          {!hasCallback && (
            <button className="fr-btn fr-ml-4w" onClick={handleNewAnalysis} disabled={isLoading}>
              Nouvelle analyse
              <span className="fr-icon-add-line fr-icon--sm fr-ml-1v" aria-hidden="true"></span>
            </button>
          )}

          {/* Bouton callback en mode iframe */}
          {isIframeMode && hasCallback && callbackLabel && (
            <button
              className="fr-btn fr-ml-4w fr-btn--icon-right fr-icon-external-link-line"
              onClick={handleCallback}
              disabled={isLoading}
            >
              {callbackLabel}
            </button>
          )}
        </div>
      </div>
    </SimpleIframeLayout>
  );
};
