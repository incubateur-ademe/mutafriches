import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEventTracking } from "../../../shared/hooks/useEventTracking";
import { identifiantCadastralTracking } from "../../../shared/form/tracking.utils";
import {
  MutabiliteOutputDto,
  TypeEvenement,
  UsageResultat,
  UsageResultatDetaille,
} from "@mutafriches/shared-types";
import { buildMutabilityInput, buildDonneesComplementaires } from "../utils/mutability.mapper";
import { ROUTES } from "../../../shared/config/routes.config";
import { Layout } from "../../../shared/components/layout/Layout";
import { LoadingCallout } from "../../../shared/components/common/LoadingCallout";
import { ErrorAlert } from "../../../shared/components/common/ErrorAlert";
import { PodiumCard } from "../components/PodiumCard";
import { ResultsTable } from "../components/ResultTable";
import { SiteRecapBanner } from "../components/SiteRecapBanner";
import { SiteRecapModal } from "../components/SiteRecapModal";
import { UsageDetailModal } from "../components/UsageDetailModal";
import { getUsagesPodium } from "../utils/usagesLabels.utils";
import { buildIframeEvaluationSummary } from "../utils/iframeSummary.mapper";
import { useFormContext } from "../../../shared/form/useFormContext";
import { useIframe, useIframeCallback, useIsIframeMode } from "../../../shared/iframe/useIframe";
import { createIframeCommunicator } from "../../../shared/iframe/iframeCommunication";
import { evaluationService } from "../../../shared/services/api/api.evaluation.service";
import { ModalInfo } from "../../../shared/components/common/ModalInfo";
import { ExportModal, type ExportSelection } from "../components/ExportModal";
import { generateMutabilitePdf } from "../export/generateMutabilitePdf";
import { buildResultatsJson } from "../export/buildResultatsJson";
import { downloadBlob, exportFileName } from "../export/downloadFile";
import type { ResultatsExportData } from "../export/types";
import { ContactMultisitesModal } from "../components/ContactMultisitesModal";
import { DebugPanelGate } from "../../debug/components/DebugPanelGate";
import { ComparaisonAlgoPanelGate } from "../../comparaison-algo/components/ComparaisonAlgoPanelGate";

interface LienUtiliserMutafrichesProps {
  // En iframe, la page s'ouvre à part : on ne navigue pas dans l'outil de l'intégrateur
  nouvelOnglet: boolean;
  className: string;
  onClick?: () => void;
  children: React.ReactNode;
}

function LienUtiliserMutafriches({
  nouvelOnglet,
  className,
  onClick,
  children,
}: LienUtiliserMutafrichesProps) {
  if (nouvelOnglet) {
    return (
      <a
        href={ROUTES.INTEGRER}
        target="_blank"
        rel="noopener noreferrer"
        title="Utiliser Mutafriches - nouvelle fenêtre"
        className={className}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }
  return (
    <Link to={ROUTES.INTEGRER} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

export const ResultatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, setMutabilityResult, setCurrentStep, canAccessStep, resetForm } = useFormContext();

  // Hooks iframe
  const isIframeMode = useIsIframeMode();
  const { hasCallback, callbackUrl, callbackLabel } = useIframeCallback();
  const { parentOrigin, integrator } = useIframe();

  // Hook tracking
  const {
    track,
    trackExporterResultats,
    trackOuvertureModaleMultisites,
    trackOuvertureRecapSite,
    trackOuvertureDetailUsage,
    trackEvaluationTerminee,
  } = useEventTracking();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutabilityData, setMutabilityData] = useState<MutabiliteOutputDto | null>(null);

  // Modal export
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Modal nouvelle analyse
  const [isNewAnalysisModalOpen, setIsNewAnalysisModalOpen] = useState(false);

  // Modal contact multisites
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Modal récapitulatif du site
  const [isRecapModalOpen, setIsRecapModalOpen] = useState(false);

  // Modal détail d'un usage
  const [usageDetail, setUsageDetail] = useState<UsageResultatDetaille | null>(null);

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

      iframeCommunicator.sendCompleted(
        buildIframeEvaluationSummary(results, state.enrichmentData, state.identifiantSite),
      );
    },
    [isIframeMode, iframeCommunicator, state.enrichmentData, state.identifiantSite],
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
        modeDetaille: true,
      });
      setMutabilityResult(result);
      setMutabilityData(result);
      sendIframeMessages(result);

      const identifiantEvenement = identifiantCadastralTracking(
        state.enrichmentData,
        state.identifiantSite,
      );
      // Tracker l'affichage des résultats avec l'evaluationId (dédoublonnage analytics)
      track(TypeEvenement.RESULTATS_MUTABILITE, {
        evaluationId: result.evaluationId || undefined,
        identifiantCadastral: identifiantEvenement,
      });

      // Tracker l'événement d'évaluation terminée (seulement si evaluationId valide)
      if (result.evaluationId) {
        await trackEvaluationTerminee(result.evaluationId, identifiantEvenement);
      }
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
    state.identifiantSite,
    track,
    trackEvaluationTerminee,
  ]);

  // useEffect principal pour l'initialisation
  useEffect(() => {
    // Protection contre les réexécutions
    if (hasInitializedRef.current) return;

    if (!canAccessStep(3)) {
      navigate(ROUTES.QUALIFICATION_RISQUES);
      return;
    }

    hasInitializedRef.current = true;
    setCurrentStep(4); // Étape 4 = résultats

    if (state.mutabilityResult) {
      // Résultat déjà disponible : tracker l'affichage des résultats avec l'evaluationId connu
      track(TypeEvenement.RESULTATS_MUTABILITE, {
        evaluationId: state.mutabilityResult.evaluationId || undefined,
        identifiantCadastral: identifiantCadastralTracking(
          state.enrichmentData,
          state.identifiantSite,
        ),
      });
      // Initialisation unique au montage (garde hasInitializedRef) : setState intentionnel
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMutabilityData(state.mutabilityResult);
      sendIframeMessages(state.mutabilityResult);
    } else {
      // Calcul asynchrone : le tracking est fait dans calculateMutability une fois l'evaluationId disponible
      calculateMutability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ouvre la modale de choix de format (le tracking se fait au choix du format).
  const handleExport = () => {
    if (!mutabilityData) return;
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
    navigate(ROUTES.ANALYSER);
  };

  // Handler pour modifier les données
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

  // Conversion des données manuelles pour les tags dynamiques
  const donneesComplementaires = useMemo(() => {
    if (!state.manualData) return undefined;
    return buildDonneesComplementaires(state.manualData);
  }, [state.manualData]);

  // Données communes aux exports PDF et JSON.
  const buildExportData = useCallback((): ResultatsExportData | null => {
    if (!mutabilityData) return null;
    return {
      mutabilite: mutabilityData,
      enrichissement: state.enrichmentData ?? undefined,
      complementaires: donneesComplementaires,
      site: {
        identifiant: state.uiData?.identifiantParcelle,
        commune: state.uiData?.commune,
        parcelles:
          state.enrichmentData?.identifiantsParcelles ??
          [state.uiData?.identifiantParcelle ?? ""].filter(Boolean),
        nombreParcelles: state.uiData?.nombreParcelles,
        surfaceM2: state.enrichmentData?.surfaceSite,
      },
    };
  }, [mutabilityData, state.enrichmentData, state.uiData, donneesComplementaires]);

  // Exporte les formats sélectionnés (PDF et/ou JSON), avec tracking par format.
  const handleExportFormats = useCallback(
    async (selection: ExportSelection) => {
      const data = buildExportData();
      if (!data || (!selection.pdf && !selection.json)) return;
      const evaluationId = data.mutabilite.evaluationId;

      // JSON : synchrone
      if (selection.json) {
        if (evaluationId) void trackExporterResultats(evaluationId, "json");
        const json = JSON.stringify(buildResultatsJson(data), null, 2);
        downloadBlob(
          new Blob([json], { type: "application/json" }),
          exportFileName(data.site.commune, "json"),
        );
      }

      // PDF : asynchrone (génération à la demande)
      if (selection.pdf) {
        if (evaluationId) void trackExporterResultats(evaluationId, "pdf");
        setPdfLoading(true);
        try {
          await generateMutabilitePdf(data);
        } catch (err) {
          console.error("Erreur export PDF:", err);
        } finally {
          setPdfLoading(false);
        }
      }

      setIsExportModalOpen(false);
    },
    [buildExportData, trackExporterResultats],
  );

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
          Modifier les données
        </button>

        <div className="fr-mt-4w" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <h1 className="fr-mb-2w">Analyse de mutabilité</h1>
          <button
            aria-describedby="tooltip-analyse"
            type="button"
            className="fr-btn--tooltip fr-btn"
          >
            infobulle
          </button>
          <span className="fr-tooltip fr-placement" id="tooltip-analyse" role="tooltip">
            Ces résultats constituent une première orientation, basée sur les éléments que nous
            avons recueillis et que vous avez renseigné. Ils doivent être croisés avec votre
            connaissance du territoire et ne se substituent pas à des études de programmation.
          </span>
        </div>

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
            <div
              className="fr-mb-2w"
              style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              <h5 className="fr-mb-0">Indice de fiabilité : {mutabilityData.fiabilite.note}/10</h5>
              <button
                aria-describedby="tooltip-fiabilite"
                type="button"
                className="fr-btn--tooltip fr-btn"
              >
                infobulle
              </button>
              <span className="fr-tooltip fr-placement" id="tooltip-fiabilite" role="tooltip">
                L'indice de fiabilité reflète la complétude des informations concernant la friche.
                Il baisse si des données manquent ou si vous indiquez "Je ne sais pas".
              </span>
            </div>

            <SiteRecapBanner
              commune={state.uiData?.commune}
              identifiantParcelle={state.uiData?.identifiantParcelle}
              nombreParcelles={state.uiData?.nombreParcelles}
              surface={state.uiData?.surfaceParcelle}
              onVoirRecap={() => {
                trackOuvertureRecapSite(mutabilityData?.evaluationId);
                setIsRecapModalOpen(true);
              }}
            />

            <div
              className="fr-mb-1w"
              style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              <h4 className="fr-mb-0">Usages les plus compatibles</h4>
              <button
                aria-describedby="tooltip-usages"
                type="button"
                className="fr-btn--tooltip fr-btn"
              >
                infobulle
              </button>
              <span className="fr-tooltip fr-placement" id="tooltip-usages" role="tooltip">
                Pour les sites de plus d'un hectare, il vous est recommandé de privilégier un mixte
                d'usages dans votre programmation.
              </span>
            </div>

            <div className="fr-grid-row fr-grid-row--gutters fr-mb-4w">
              {getUsagesPodium(mutabilityData.resultats).map((result) => (
                <PodiumCard
                  key={result.usage}
                  result={result}
                  enrichmentData={state.enrichmentData}
                  manualData={donneesComplementaires}
                />
              ))}
            </div>

            {/* Table des résultats */}
            <ResultsTable
              results={mutabilityData.resultats}
              onVoirDetail={(result: UsageResultat) => {
                trackOuvertureDetailUsage(result, mutabilityData.evaluationId);
                setUsageDetail(result as UsageResultatDetaille);
              }}
            />
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

          {mutabilityData && !isLoading && (
            // Icône en span : posée par classe dans un groupe, elle masquerait le libellé
            <button className="fr-btn fr-btn--secondary" onClick={handleExport}>
              <span
                className="fr-icon-download-line fr-icon--sm fr-mr-1v"
                aria-hidden="true"
              ></span>
              Exporter les résultats
            </button>
          )}
        </div>

        {/* CTA : passage à l'échelle du territoire, carte arrondie fond vert clair */}
        <div
          className="fr-mt-4w"
          // Fond vert clair (#B8FEC9, badge EXCELLENT), non couvert par une classe DSFR
          style={{ padding: "2.5rem", backgroundColor: "#B8FEC9", borderRadius: "24px" }}
        >
          <h4 className="fr-mb-2w">
            Prêt à utiliser Mutafriches à l'échelle de votre territoire ?
          </h4>
          <p className="fr-mb-4w">
            Intégrez Mutafriches directement dans vos outils pour enrichir votre stratégie
            territoriale. Qualifiez et analysez plusieurs sites simultanément, identifiez leur
            potentiel de reconversion et explorez les usages les plus adaptés.
          </p>
          <div className="flex flex-col items-center gap-[1rem]">
            <LienUtiliserMutafriches nouvelOnglet={isIframeMode} className="fr-btn">
              Découvrir les possibilités d'utilisation
            </LienUtiliserMutafriches>
            <button
              className="fr-btn fr-btn--secondary"
              // Fond blanc forcé : le secondary DSFR est transparent et laisse voir le vert
              style={{ backgroundColor: "#fff" }}
              onClick={() => {
                trackOuvertureModaleMultisites(mutabilityData?.evaluationId);
                setIsContactModalOpen(true);
              }}
            >
              Échanger avec l'équipe Mutafriches
            </button>
          </div>
        </div>
      </div>

      {/* Modal d'export (choix du format) */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportFormats}
        loading={pdfLoading}
      />

      {/* Modal de confirmation nouvelle analyse */}
      <ModalInfo
        id="modal-new-analysis"
        title="Nouvelle analyse"
        isOpen={isNewAnalysisModalOpen}
        onClose={() => setIsNewAnalysisModalOpen(false)}
        icon="fr-icon-refresh-line"
      >
        <p>Voulez-vous vraiment démarrer une nouvelle analyse ?</p>
        <p className="fr-text--sm">Les données actuelles seront perdues.</p>
        <ul className="fr-btns-group fr-btns-group--inline fr-btns-group--center">
          <li>
            <button
              className="fr-btn fr-btn--secondary"
              onClick={() => setIsNewAnalysisModalOpen(false)}
            >
              Annuler
            </button>
          </li>
          <li>
            <button className="fr-btn" onClick={handleConfirmNewAnalysis}>
              Oui, nouvelle analyse
            </button>
          </li>
        </ul>
        <p className="text-center fr-mb-0">
          <LienUtiliserMutafriches
            nouvelOnglet={isIframeMode}
            className="fr-link fr-icon-arrow-right-line fr-link--icon-left"
            // La modale est refermée avant de changer de page, pour libérer le défilement
            onClick={() => setIsNewAnalysisModalOpen(false)}
          >
            Mener des analyses sur plusieurs sites à l'échelle de mon territoire
          </LienUtiliserMutafriches>
        </p>
      </ModalInfo>

      {/* Modal récapitulatif du site */}
      <SiteRecapModal
        isOpen={isRecapModalOpen}
        onClose={() => setIsRecapModalOpen(false)}
        enrichissement={state.enrichmentData}
        complementaires={donneesComplementaires}
      />

      {/* Modal détail d'un usage */}
      <UsageDetailModal
        isOpen={!!usageDetail}
        onClose={() => setUsageDetail(null)}
        usage={usageDetail}
        enrichissement={state.enrichmentData}
        complementaires={donneesComplementaires}
      />

      {/* Modal de contact multisites */}
      <ContactMultisitesModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      {/* Panneau de diagnostic (dev/staging uniquement) */}
      <DebugPanelGate
        enrichmentData={state.enrichmentData}
        manualData={state.manualData}
        mutabilityData={mutabilityData}
        identifiantSite={state.identifiantSite}
      />

      {/* Panneau de comparaison algorithme (dev/staging uniquement) */}
      <ComparaisonAlgoPanelGate
        enrichmentData={state.enrichmentData}
        donneesComplementaires={state.manualData}
      />
    </Layout>
  );
};
