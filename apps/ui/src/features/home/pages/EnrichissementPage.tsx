import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../../shared/config/routes.config";
import { Layout } from "../../../shared/components/layout/Layout";
import { ErrorAlert } from "../../../shared/components/common/ErrorAlert";
import { useFormContext } from "../../../shared/form/useFormContext";
import { enrichissementService } from "../../../shared/services/api/api.enrichissement.service";
import { TypeEvenement } from "@mutafriches/shared-types";
import { useEventTracking } from "../../../shared/hooks/useEventTracking";
import { EnrichmentLoadingCallout } from "../components/EnrichmentLoadingCallout";
import { transformEnrichmentToUiData } from "../utils/enrichissment.mapper";

const MIN_LOADING_TIME = 3000; // 3 secondes minimum

interface LocationState {
  identifiant?: string;
}

export const EnrichissementPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setEnrichmentData, setCurrentStep } = useFormContext();
  const { track } = useEventTracking();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasStartedEnrichment = useRef(false);

  const locationState = location.state as LocationState | null;
  const identifiant = locationState?.identifiant;

  useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  useEffect(() => {
    if (!identifiant) {
      // Pas d'identifiant, retour a l'accueil
      navigate(ROUTES.HOME);
      return;
    }

    // Guard contre les doubles appels (StrictMode React)
    if (hasStartedEnrichment.current) {
      return;
    }
    hasStartedEnrichment.current = true;

    const enrichirParcelle = async () => {
      setIsLoading(true);
      setError(null);

      const startTime = Date.now();

      try {
        const enrichmentResult = await enrichissementService.enrichirParcelle(identifiant);
        const uiData = transformEnrichmentToUiData(enrichmentResult);

        // Calculer le temps ecoule
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);

        // Attendre le temps restant pour atteindre 3 secondes minimum
        await new Promise((resolve) => setTimeout(resolve, remainingTime));

        setEnrichmentData(enrichmentResult, uiData, identifiant);

        // Tracker l'evenement d'enrichissement termine
        await track(TypeEvenement.ENRICHISSEMENT_TERMINE, {
          identifiantCadastral: identifiant,
        });

        // Naviguer vers la premiere etape de qualification
        navigate(ROUTES.QUALIFICATION_SITE);
      } catch (err) {
        // Meme en cas d'erreur, respecter le temps minimum
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
        await new Promise((resolve) => setTimeout(resolve, remainingTime));

        setError(err instanceof Error ? err.message : "Une erreur est survenue");
        setIsLoading(false);
      }
    };

    enrichirParcelle();
  }, [identifiant, navigate, setEnrichmentData, track]);

  const handleRetry = () => {
    if (identifiant) {
      // Relancer l'enrichissement
      window.location.reload();
    } else {
      navigate(ROUTES.HOME);
    }
  };

  const handleBack = () => {
    navigate(ROUTES.HOME);
  };

  return (
    <Layout>
      <div className="fr-mt-6w fr-mb-4w">
        {isLoading && (
          <div className="fr-container--fluid">
            <EnrichmentLoadingCallout />
          </div>
        )}

        {error && !isLoading && (
          <div className="fr-container--fluid">
            <ErrorAlert message={error} />
            <div className="fr-mt-4w fr-btns-group">
              <button className="fr-btn" onClick={handleRetry}>
                Reessayer
              </button>
              <button className="fr-btn fr-btn--secondary" onClick={handleBack}>
                Retour a l'accueil
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
