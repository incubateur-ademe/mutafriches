import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../shared/config/routes.config";
import { Stepper } from "../../../shared/components/layout";
import { Layout } from "../../../shared/components/layout/Layout";
import { useFormContext } from "../../../shared/form/useFormContext";
import { useEventTracking } from "../../../shared/hooks/useEventTracking";
import { identifiantCadastralTracking } from "../../../shared/form/tracking.utils";
import { MESSAGE_ZONE_EXCLUSION_ENR, TypeEvenement } from "@mutafriches/shared-types";
import { EnrichedInfoField, StepNavigation } from "../components";
import { DebugPanelGate } from "../../debug/components/DebugPanelGate";

export const QualificationRisquesPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, setCurrentStep, canAccessStep } = useFormContext();
  const { track } = useEventTracking();
  const hasTrackedVisit = useRef(false);

  // Vérifier l'accès à cette étape
  useEffect(() => {
    if (!canAccessStep(3)) {
      navigate(ROUTES.QUALIFICATION_ENVIRONNEMENT);
      return;
    }
    setCurrentStep(3);

    // Tracker l'arrivée sur la page
    if (!hasTrackedVisit.current) {
      hasTrackedVisit.current = true;
      track(TypeEvenement.QUALIFICATION_RISQUES, {
        identifiantCadastral: identifiantCadastralTracking(
          state.enrichmentData,
          state.identifiantSite,
        ),
      });
    }
  }, [canAccessStep, navigate, setCurrentStep, track, state.enrichmentData, state.identifiantSite]);

  const handlePrevious = () => {
    navigate(ROUTES.QUALIFICATION_ENVIRONNEMENT);
  };

  const handleNext = () => {
    navigate(ROUTES.RESULTATS);
  };

  // Si pas d'accès, ne rien afficher (la redirection se fait dans useEffect)
  if (!canAccessStep(3)) {
    return null;
  }

  const uiData = state.uiData;

  return (
    <Layout>
      <Stepper
        currentStep={3}
        totalSteps={3}
        currentStepTitle="Qualifier les risques et zonages du site"
        nextStepTitle="Analyse de mutabilité"
      />

      {/* Zone 1 - Risques technologiques et naturels */}
      <div className="fr-grid-row fr-grid-row--gutters">
        <EnrichedInfoField
          id="presence-risques-technologiques"
          label="Présence de risques technologiques"
          value={uiData?.risquesTechno}
          tooltip={
            <>
              Récupéré depuis les données de l'API GéoRisques :<br />
              <a
                href="https://georisques.gouv.fr/doc-api"
                target="_blank"
                rel="noopener noreferrer"
                className="fr-link fr-text--xs"
              >
                georisques.gouv.fr/doc-api
              </a>
            </>
          }
        />

        <EnrichedInfoField
          id="risques-naturels"
          label="Risques naturels"
          value={uiData?.risquesNaturels}
          tooltip={
            <>
              Récupéré depuis les données de l'API GéoRisques :<br />
              <a
                href="https://www.georisques.gouv.fr/citoyen-recherche-map"
                target="_blank"
                rel="noopener noreferrer"
                className="fr-link fr-text--xs"
              >
                georisques.gouv.fr/citoyen-recherche-map
              </a>
            </>
          }
        />
      </div>

      <hr className="fr-my-4w" />

      {/* Zone 2 - Zonages environnemental et réglementaire */}
      <div className="fr-grid-row fr-grid-row--gutters">
        <EnrichedInfoField
          id="type-zonage-environnemental"
          label="Type de zonage environnemental"
          value={uiData?.zonageEnviro}
          tooltip={
            <>
              Données enrichies via les API Carto Nature et GPU de l'IGN :<br />
              <a
                href="https://apicarto.ign.fr/api/doc/"
                target="_blank"
                rel="noopener noreferrer"
                className="fr-link fr-text--xs"
              >
                apicarto.ign.fr/api/doc/
              </a>
            </>
          }
        />

        <EnrichedInfoField
          id="type-zonage-reglementaire"
          label="Type de zonage réglementaire"
          value={uiData?.zonageUrba}
          tooltip={
            <>
              Données enrichies via les API Carto Nature et GPU de l'IGN :<br />
              <a
                href="https://apicarto.ign.fr/api/doc/"
                target="_blank"
                rel="noopener noreferrer"
                className="fr-link fr-text--xs"
              >
                apicarto.ign.fr/api/doc/
              </a>
            </>
          }
        />
      </div>

      <hr className="fr-my-4w" />

      {/* Zone 3 - Zonage patrimonial, ZAER & Zonage ABC */}
      <div className="fr-grid-row fr-grid-row--gutters">
        <EnrichedInfoField
          id="type-zonage-patrimonial"
          label="Type de zonage patrimonial"
          value={uiData?.zonagePatrimonial}
          tooltip={
            <>
              Données enrichies via les API Carto Nature et GPU de l'IGN :<br />
              <a
                href="https://apicarto.ign.fr/api/doc/"
                target="_blank"
                rel="noopener noreferrer"
                className="fr-link fr-text--xs"
              >
                apicarto.ign.fr/api/doc/
              </a>
            </>
          }
        />

        {/*   Zone d'accélération des énergies renouvelables */}
        <EnrichedInfoField
          id="zone-acceleration-enr"
          label="Zone d'accélération des énergies renouvelables"
          value={
            uiData?.zaerBadges && uiData.zaerBadges.length > 0
              ? uiData.zaerBadges
              : uiData?.zoneAccelerationEnr
          }
          enAlerte={uiData?.zaerExclusion}
          message={uiData?.zaerExclusion ? MESSAGE_ZONE_EXCLUSION_ENR : undefined}
          tooltip={
            <>
              Données enrichies via le WFS Géoplateforme (ZAER) :<br />
              <a
                href="https://data.geopf.fr/wfs?service=WFS&request=GetCapabilities"
                target="_blank"
                rel="noopener noreferrer"
                className="fr-link fr-text--xs"
              >
                data.geopf.fr/wfs
              </a>
            </>
          }
        />
      </div>

      <hr className="fr-my-4w" />

      {/* Zone 4 - Zonage ABC, quartier prioritaire & saturation réseau EnR */}
      <div className="fr-grid-row fr-grid-row--gutters">
        <EnrichedInfoField
          id="zonage-abc-logement"
          label="Type de zone pour le logement"
          value={uiData?.zonageAbcLogement}
          tooltip={
            <>
              Récupéré depuis : Liste des communes selon le zonage ABC (data.gouv.fr) :<br />
              <a
                href="https://www.data.gouv.fr/datasets/liste-des-communes-selon-le-zonage-abc"
                target="_blank"
                rel="noopener noreferrer"
                className="fr-link fr-text--xs"
              >
                data.gouv.fr - Zonage ABC
              </a>
            </>
          }
        />

        <EnrichedInfoField
          id="site-en-qpv"
          label="Quartier Prioritaire de la politique de la Ville (QPV)"
          value={uiData?.siteEnQpv}
          tooltip={
            <>
              Site localisé ou non au sein d'un Quartier Prioritaire de la politique de la Ville
              (QPV), d'après les périmètres publiés par l'ANCT :<br />
              <a
                href="https://www.data.gouv.fr/datasets/quartiers-prioritaires-de-la-politique-de-la-ville-qpv"
                target="_blank"
                rel="noopener noreferrer"
                className="fr-link fr-text--xs"
              >
                data.gouv.fr - Quartiers prioritaires
              </a>
            </>
          }
        />

        <EnrichedInfoField
          id="saturation-reseau-enr"
          label="Saturation électrique du réseau pour projets d'énergies renouvelables"
          value={uiData?.saturationReseauEnr}
          tooltip={
            <>
              Données Enedis et RTE, fournies à titre indicatif et sans valeur contractuelle :
              <br />
              <a
                href="https://openservices.enedis.fr/service/carte-zones-contrainte-projets-enr/"
                target="_blank"
                rel="noopener noreferrer"
                className="fr-link fr-text--xs"
              >
                openservices.enedis.fr - Carte des zones de contrainte EnR
              </a>
            </>
          }
        />
      </div>
      <hr className="fr-my-4w" />

      <StepNavigation
        onPrevious={handlePrevious}
        onNext={handleNext}
        previousLabel="Précédent"
        nextLabel="Calculer la mutabilité"
      />

      <DebugPanelGate
        enrichmentData={state.enrichmentData}
        manualData={state.manualData}
        mutabilityData={null}
        identifiantSite={state.identifiantSite}
      />
    </Layout>
  );
};
