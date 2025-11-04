import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useEventTracking } from "../../../shared/hooks/useEventTracking";
import { MutabiliteOutputDto } from "../../../../../../packages/shared-types/src";
import { buildMutabilityInput } from "../utils/mutability.mapper";
import { ROUTES } from "../../../shared/config/routes.config";
import { Stepper } from "../../../shared/components/layout";
import { Layout } from "../../../shared/components/layout/Layout";
import { LoadingCallout } from "../../../shared/components/common/LoadingCallout";
import { ErrorAlert } from "../../../shared/components/common/ErrorAlert";
import { PodiumCard } from "../components/PodiumCard";
import { ReliabilityScore } from "../components/ReliabilityScore";
import { ResultsTable } from "../components/ResultTable";
import { PartnerCard } from "../components/PartnerCard";
import { useFormContext } from "../../../shared/form/useFormContext";
import { useIframe, useIframeCallback, useIsIframeMode } from "../../../shared/iframe/useIframe";
import { createIframeCommunicator } from "../../../shared/iframe/iframeCommunication";
import { IframeEvaluationSummaryDto } from "../../../shared/iframe/iframe.types";
import { evaluationService } from "../../../shared/services/api/api.evaluation.service";
import { ModalInfo } from "../../../shared/components/common/ModalInfo";

export const Step3ResultatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, setMutabilityResult, setCurrentStep, canAccessStep, resetForm } = useFormContext();

  // Hooks iframe
  const isIframeMode = useIsIframeMode();
  const { hasCallback, callbackUrl, callbackLabel } = useIframeCallback();
  const { parentOrigin, integrator } = useIframe();

  // Hook tracking
  const { trackFeedback, trackExporterResultats } = useEventTracking();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutabilityData, setMutabilityData] = useState<MutabiliteOutputDto | null>(null);
  const [feedbackEnvoye, setFeedbackEnvoye] = useState(false);
  const [trackingExporterEnvoye, setTrackingExporterEnvoye] = useState(false);

  // Modal export
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Un seul ref pour tracker si on a déjà initialisé
  const hasInitializedRef = React.useRef(false);

  // Créer le communicator une seule fois
  const iframeCommunicator = React.useMemo(() => {
    if (isIframeMode && parentOrigin) {
      return createIframeCommunicator(parentOrigin);
    }
    return null;
  }, [isIframeMode, parentOrigin]);

  // Fonction pour envoyer les messages iframe
  const sendIframeMessages = useCallback(
    (results: MutabiliteOutputDto) => {
      if (!isIframeMode || !iframeCommunicator) return;

      // Données détaillées renvoyées vers l'intégrateur
      const evaluationSummary: IframeEvaluationSummaryDto = {
        evaluationId: results.evaluationId || "",
        identifiantParcelle: state.identifiantParcelle || "",
        retrieveUrl: `/friches/evaluations/${results.evaluationId}`,
        fiabilite: {
          note: results.fiabilite.note,
          text: results.fiabilite.text,
        },
        usagePrincipal: {
          usage: results.resultats[0].usage,
          indiceMutabilite: results.resultats[0].indiceMutabilite,
          potentiel: results.resultats[0].potentiel || "",
        },
        top3Usages: results.resultats.slice(0, 3).map((r) => ({
          usage: r.usage,
          indiceMutabilite: r.indiceMutabilite,
          rang: r.rang,
        })),
        metadata: {
          dateAnalyse: new Date().toISOString(),
          versionAlgorithme: "1.1", // TODO À mettre à jour avec la vraie version via package shared si besoin
        },
      };

      iframeCommunicator.sendCompleted(evaluationSummary);
    },
    [isIframeMode, iframeCommunicator, state.identifiantParcelle],
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
      const result = await evaluationService.calculerMutabilite(mutabilityInput, {
        isIframe: isIframeMode,
        integrator: integrator || undefined,
      });
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
    integrator,
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

    if (state.mutabilityResult) {
      setMutabilityData(state.mutabilityResult);
      sendIframeMessages(state.mutabilityResult);
    } else {
      calculateMutability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler pour le feedback de pertinence
  const handlePertinenceFeedback = async (pertinent: boolean) => {
    if (!mutabilityData?.evaluationId || feedbackEnvoye) return;

    try {
      await trackFeedback(mutabilityData.evaluationId, pertinent);
      setFeedbackEnvoye(true);
    } catch (err) {
      console.error("Erreur feedback:", err);
    }
  };

  // Handler pour exporter les résultats
  const handleExport = async () => {
    if (!mutabilityData?.evaluationId || trackingExporterEnvoye) return;

    try {
      await trackExporterResultats(mutabilityData.evaluationId);
      setTrackingExporterEnvoye(true);
    } catch (err) {
      console.error("Erreur tracking export:", err);
    }

    setIsExportModalOpen(true);
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

  if (!canAccessStep(3)) {
    return null;
  }

  return (
    <Layout>
      <Stepper
        currentStep={3}
        totalSteps={3}
        currentStepTitle="Consulter les usages appropriés à la parcelle"
        nextStepTitle="Analyse terminée"
      />

      <div className="fr-mb-4w">
        <h3>Consultez les usages les plus appropriés à la parcelle</h3>
        <p className="fr-text--sm">
          Au regard des caractéristiques sourcées et renseignées, vous trouverez les usages les plus
          pertinents pour votre site.
        </p>

        {isLoading && (
          <LoadingCallout
            title="Calcul en cours"
            message="Analyse de la mutabilité de votre friche..."
          />
        )}

        {error && !isLoading && <ErrorAlert message={error} />}

        {mutabilityData && !isLoading && (
          <>
            {/* Indice de fiabilité */}
            <ReliabilityScore
              note={mutabilityData.fiabilite.note}
              text={mutabilityData.fiabilite.text}
              description={mutabilityData.fiabilite.description}
            />

            {/* Podium des usages */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h4 className="fr-mb-0 fr-mt-4w">Usages les plus appropriés à la parcelle</h4>
              <button
                className="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-download-line fr-btn--sm"
                onClick={handleExport}
              >
                Exporter les résultats
              </button>
            </div>

            <div className="fr-grid-row fr-grid-row--gutters fr-mb-4w">
              {mutabilityData.resultats.slice(0, 3).map((result, index) => (
                <PodiumCard
                  key={result.usage}
                  result={result}
                  position={(index + 1) as 1 | 2 | 3}
                  evaluationId={mutabilityData.evaluationId}
                />
              ))}
            </div>

            {/* Question pertinence - MISE À JOUR */}
            <div
              className="fr-mt-4w fr-mb-4w"
              style={{ display: "flex", justifyContent: "center" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                {feedbackEnvoye ? (
                  <div className="fr-alert fr-alert--success fr-alert--sm">
                    <h3 className="fr-alert__title">Merci pour votre retour</h3>
                  </div>
                ) : (
                  <>
                    <p className="fr-text--sm" style={{ margin: 0, fontWeight: "normal" }}>
                      Ce classement vous semble-t-il pertinent ?
                    </p>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                      <div className="fr-radio-group fr-radio-group--sm" style={{ margin: 0 }}>
                        <input
                          type="radio"
                          onClick={() => handlePertinenceFeedback(true)}
                          id="radio-pertinent-oui"
                          name="pertinence"
                        />
                        <label
                          className="fr-label fr-text--sm"
                          htmlFor="radio-pertinent-oui"
                          style={{ margin: 0 }}
                        >
                          Oui
                        </label>
                      </div>
                      <div className="fr-radio-group fr-radio-group--sm" style={{ margin: 0 }}>
                        <input
                          type="radio"
                          onClick={() => handlePertinenceFeedback(false)}
                          id="radio-pertinent-non"
                          name="pertinence"
                        />
                        <label
                          className="fr-label fr-text--sm"
                          htmlFor="radio-pertinent-non"
                          style={{ margin: 0 }}
                        >
                          Non
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <ResultsTable results={mutabilityData.resultats} />

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

        <div className="fr-mt-4w" style={{ textAlign: "center" }}>
          <button
            className="fr-btn fr-btn--secondary"
            onClick={handleModifyData}
            disabled={isLoading}
          >
            <span className="fr-icon-arrow-left-s-line fr-icon--sm" aria-hidden="true"></span>
            Modifier les données
          </button>

          {!hasCallback && (
            <button className="fr-btn fr-ml-4w" onClick={handleNewAnalysis} disabled={isLoading}>
              Nouvelle analyse
              <span className="fr-icon-add-line fr-icon--sm fr-ml-1v" aria-hidden="true"></span>
            </button>
          )}

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

      {/* Modal d'export */}
      <ModalInfo
        id="modal-export"
        title="Export des résultats"
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        icon="fr-icon-download-line"
      >
        <p>
          La fonctionnalité d'export PDF est en cours de développement et sera bientôt disponible !
        </p>
        <p className="fr-text--sm">
          Vous pourrez exporter vos résultats d'analyse en format PDF pour les partager ou les
          conserver.
        </p>
      </ModalInfo>
    </Layout>
  );
};
