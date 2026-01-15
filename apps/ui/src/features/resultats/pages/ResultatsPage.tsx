import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useEventTracking } from "../../../shared/hooks/useEventTracking";
import { MutabiliteOutputDto } from "@mutafriches/shared-types";
import { buildMutabilityInput } from "../utils/mutability.mapper";
import { ROUTES } from "../../../shared/config/routes.config";
import { Layout } from "../../../shared/components/layout/Layout";
import { LoadingCallout } from "../../../shared/components/common/LoadingCallout";
import { ErrorAlert } from "../../../shared/components/common/ErrorAlert";
import { PodiumCard } from "../components/PodiumCard";
import { ResultsTable } from "../components/ResultTable";
import { PartnerCard } from "../components/PartnerCard";
import { useFormContext } from "../../../shared/form/useFormContext";
import { useIframe, useIframeCallback, useIsIframeMode } from "../../../shared/iframe/useIframe";
import { createIframeCommunicator } from "../../../shared/iframe/iframeCommunication";
import { IframeEvaluationSummaryDto } from "../../../shared/iframe/iframe.types";
import { evaluationService } from "../../../shared/services/api/api.evaluation.service";
import { ModalInfo } from "../../../shared/components/common/ModalInfo";
import { VERSION_ALGO } from "@mutafriches/shared-types";

export const ResultatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, setMutabilityResult, setCurrentStep, canAccessStep, resetForm } = useFormContext();

  // Hooks iframe
  const isIframeMode = useIsIframeMode();
  const { hasCallback, callbackUrl, callbackLabel } = useIframeCallback();
  const { parentOrigin, integrator } = useIframe();

  // Hook tracking
  const { trackExporterResultats, trackEvaluationTerminee } = useEventTracking();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutabilityData, setMutabilityData] = useState<MutabiliteOutputDto | null>(null);
  const [trackingExporterEnvoye, setTrackingExporterEnvoye] = useState(false);

  // Modal export
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Modal nouvelle analyse
  const [isNewAnalysisModalOpen, setIsNewAnalysisModalOpen] = useState(false);

  // Un seul ref pour tracker si on a deja initialise
  const hasInitializedRef = React.useRef(false);

  // Creer le communicator une seule fois
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

      // Donnees detaillees renvoyees vers l'integrateur
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
          versionAlgorithme: VERSION_ALGO,
        },
      };

      iframeCommunicator.sendCompleted(evaluationSummary);
    },
    [isIframeMode, iframeCommunicator, state.identifiantParcelle],
  );

  // Fonction pour calculer la mutabilite
  const calculateMutability = useCallback(async () => {
    if (!state.enrichmentData || !state.manualData) {
      setError("Donnees manquantes pour le calcul");
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

      // Tracker l'evenement d'evaluation terminee
      await trackEvaluationTerminee(
        result.evaluationId || "ERROR_NO_ID",
        state.identifiantParcelle || undefined,
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur lors du calcul de mutabilite";
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
    state.identifiantParcelle,
    trackEvaluationTerminee,
  ]);

  // useEffect principal pour l'initialisation
  useEffect(() => {
    // Protection contre les reexecutions
    if (hasInitializedRef.current) return;

    if (!canAccessStep(3)) {
      navigate(ROUTES.QUALIFICATION_RISQUES);
      return;
    }

    hasInitializedRef.current = true;
    setCurrentStep(4); // Etape 4 = resultats

    if (state.mutabilityResult) {
      setMutabilityData(state.mutabilityResult);
      sendIframeMessages(state.mutabilityResult);
    } else {
      calculateMutability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler pour exporter les resultats
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
    setIsNewAnalysisModalOpen(true);
  };

  // Handler pour confirmer nouvelle analyse
  const handleConfirmNewAnalysis = () => {
    setIsNewAnalysisModalOpen(false);
    resetForm();
    navigate(ROUTES.HOME);
  };

  // Handler pour modifier les donnees
  const handleModifyData = () => {
    navigate(ROUTES.QUALIFICATION_SITE);
  };

  // Handler pour revenir à l'étape précédente
  const handlePreviousStep = () => {
    navigate(ROUTES.QUALIFICATION_RISQUES);
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
      <div className="fr-mb-4w fr-py-4w">
        <button
          type="button"
          className="fr-btn fr-icon-arrow-left-s-line fr-btn--icon-left fr-btn--secondary"
          onClick={handleModifyData}
        >
          Modifier les donnees
        </button>

        <h1 className="fr-mt-4w">Analyse de mutabilité</h1>
        <p className="fr-text--lead">
          ⚠️ Ces résultats constituent <strong>une première orientation</strong>, fondée sur des
          données dont la fiabilité et la précision peuvent varier. Ils doivent être{" "}
          <strong>croisés avec votre connaissance</strong> du territoire et ne se substituent pas à
          des études de programmation. du territoire et ne se substituent pas à des études de
          programmation.
        </p>

        {isLoading && (
          <LoadingCallout
            title="Calcul en cours"
            message="Analyse de la mutabilite de votre friche..."
          />
        )}

        {error && !isLoading && <ErrorAlert message={error} />}

        {mutabilityData && !isLoading && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              {/* Indice de fiabilite */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <p className="fr-text fr-mb-0">
                  <strong>Indice de fiabilite : {mutabilityData.fiabilite.note}/10</strong>
                </p>
                <button
                  aria-describedby="tooltip-fiabilite"
                  type="button"
                  className="fr-btn--tooltip fr-btn"
                >
                  infobulle
                </button>
                <span className="fr-tooltip fr-placement" id="tooltip-fiabilite" role="tooltip">
                  L'indice de fiabilite reflete la completude des informations concernant la friche.
                  Il baisse si des donnees manquent ou si vous indiquez "Je ne sais pas".
                </span>
              </div>

              <button
                className="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-download-line fr-btn--sm"
                onClick={handleExport}
              >
                Exporter les resultats
              </button>
            </div>

            <div className="fr-grid-row fr-grid-row--gutters fr-mb-4w">
              {mutabilityData.resultats.slice(0, 3).map((result, index) => (
                <PodiumCard
                  key={result.usage}
                  result={result}
                  position={(index + 1) as 1 | 2 | 3}
                />
              ))}
            </div>

            {/* Table des résultats */}
            <ResultsTable results={mutabilityData.resultats} />

            {/* Accordéon Ecosysteme friches */}
            <div className="fr-mt-4w">
              <section className="fr-accordion">
                <h4 className="fr-accordion__title">
                  <button className="fr-accordion__btn" aria-expanded="false" aria-controls="tools">
                    Aller plus loin gràce à l'écosystème friches
                  </button>
                </h4>
                <div className="fr-collapse" id="tools">
                  <div className="fr-grid-row fr-grid-row--gutters">
                    <PartnerCard
                      logo="/images/logo-urbanvitaliz.svg"
                      logoAlt="Logo Urban Vitaliz"
                      description="Pour etre accompagne dans votre projet de rehabilitation par des conseillers competents."
                      url="https://urbanvitaliz.fr"
                    />

                    <PartnerCard
                      logo="/images/logo-cartofriches.svg"
                      logoAlt="Logo Cartofriches"
                      description="Rendez votre friche visible sur l'inventaire national pour la rendre trouvable par des porteurs de projet."
                      url="https://cartofriches.cerema.fr"
                    />
                  </div>
                </div>
              </section>
            </div>
          </>
        )}

        <div className="fr-mt-4w fr-btns-group fr-btns-group--inline fr-btns-group--center">
          <button
            className="fr-btn fr-btn--secondary"
            onClick={handlePreviousStep}
            disabled={isLoading}
          >
            <span className="fr-icon-arrow-left-s-line fr-icon--sm" aria-hidden="true"></span>
            Précédent
          </button>

          {!hasCallback && (
            <button className="fr-btn" onClick={handleNewAnalysis} disabled={isLoading}>
              Nouvelle analyse
              <span className="fr-icon-add-line fr-icon--sm fr-ml-1v" aria-hidden="true"></span>
            </button>
          )}

          {isIframeMode && hasCallback && callbackLabel && (
            <button
              className="fr-btn fr-btn--icon-right fr-icon-external-link-line"
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
        title="Export des resultats"
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        icon="fr-icon-download-line"
      >
        <p>
          La fonctionnalite d'export PDF est en cours de developpement et sera bientot disponible !
        </p>
        <p className="fr-text--sm">
          Vous pourrez exporter vos resultats d'analyse en format PDF pour les partager ou les
          conserver.
        </p>
      </ModalInfo>

      {/* Modal de confirmation nouvelle analyse */}
      <ModalInfo
        id="modal-new-analysis"
        title="Nouvelle analyse"
        isOpen={isNewAnalysisModalOpen}
        onClose={() => setIsNewAnalysisModalOpen(false)}
        icon="fr-icon-refresh-line"
        actions={
          <>
            <button
              className="fr-btn fr-btn--secondary"
              onClick={() => setIsNewAnalysisModalOpen(false)}
            >
              Annuler
            </button>
            <button className="fr-btn" onClick={handleConfirmNewAnalysis}>
              Oui, nouvelle analyse
            </button>
          </>
        }
      >
        <p>Voulez-vous vraiment demarrer une nouvelle analyse ?</p>
        <p className="fr-text--sm">Les donnees actuelles seront perdues.</p>
      </ModalInfo>
    </Layout>
  );
};
