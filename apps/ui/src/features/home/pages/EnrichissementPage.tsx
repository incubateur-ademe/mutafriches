import React, { useEffect, useState, useRef, useMemo } from "react";
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
  /** Rétro-compatible : identifiant unique (ancien format) */
  identifiant?: string;
  /** Nouveau format : tableau d'identifiants */
  identifiants?: string[];
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

  // Normaliser : accepter les deux formats (identifiants[] ou identifiant string)
  const identifiantsKey = (
    locationState?.identifiants ?? (locationState?.identifiant ? [locationState.identifiant] : [])
  ).join(",");
  const identifiants = useMemo(
    () => (identifiantsKey ? identifiantsKey.split(",") : []),
    [identifiantsKey],
  );

  useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  useEffect(() => {
    if (identifiants.length === 0) {
      navigate(ROUTES.HOME);
      return;
    }

    // Guard contre les doubles appels (StrictMode React)
    if (hasStartedEnrichment.current) {
      return;
    }
    hasStartedEnrichment.current = true;

    const enrichirSite = async () => {
      setIsLoading(true);
      setError(null);

      const startTime = Date.now();

      try {
        const enrichmentResult = await enrichissementService.enrichirSite(identifiants);
        const uiData = transformEnrichmentToUiData(enrichmentResult);

        // Calculer le temps écoulé
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);

        // Attendre le temps restant pour atteindre 3 secondes minimum
        await new Promise((resolve) => setTimeout(resolve, remainingTime));

        setEnrichmentData(enrichmentResult, uiData, identifiantsKey);

        // Tracker l'événement d'enrichissement terminé
        await track(TypeEvenement.ENRICHISSEMENT_TERMINE, {
          identifiantCadastral: identifiantsKey,
          donnees: {
            nombreParcelles: identifiants.length,
          },
        });

        // Naviguer vers la première étape de qualification
        navigate(ROUTES.QUALIFICATION_SITE);
      } catch (err) {
        // Même en cas d'erreur, respecter le temps minimum
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
        await new Promise((resolve) => setTimeout(resolve, remainingTime));

        setError(err instanceof Error ? err.message : "Une erreur est survenue");
        setIsLoading(false);
      }
    };

    enrichirSite();
  }, [identifiants, identifiantsKey, navigate, setEnrichmentData, track]);

  const handleRetry = () => {
    if (identifiants.length > 0) {
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
                Réessayer
              </button>
              <button className="fr-btn fr-btn--secondary" onClick={handleBack}>
                Retour à l'accueil
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
