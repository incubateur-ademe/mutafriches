import { Routes, Route } from "react-router-dom";
import { ROUTES } from "./shared/config/routes.config";
import { Tests } from "./features/tests/pages/TestsPage";
import { IframeProvider } from "./shared/iframe/IframeProvider";
import { FormProvider } from "./shared/form/FormProvider";
import { TestIframe } from "./features/tests/test-iframe/pages/TestIframe";
import { TestCallback } from "./features/tests/test-iframe/pages/TestCallback";
import { DiagnosticParcellePage } from "./features/tests/test-idu-diagnostic/pages/DiagnosticParcellePage";
import { ResolutionIduPage } from "./features/tests/test-resolution-idu/pages/ResolutionIduPage";
import { useEventTracking } from "./shared/hooks/useEventTracking";
import { useEffect, useRef } from "react";
import { TypeEvenement } from "@mutafriches/shared-types";
import { useIframe } from "./shared/iframe/useIframe";
import { ScrollToTop } from "./shared/components/common/ScrollToTop";

// Pages
import { LandingPage } from "./features/landing/pages/LandingPage";
import { AnalyserPage } from "./features/analyser/pages/AnalyserPage";
import { EnrichissementPage } from "./features/analyser/pages/EnrichissementPage";
import { QualificationSitePage } from "./features/qualification/pages/QualificationSitePage";
import { QualificationEnvironnementPage } from "./features/qualification/pages/QualificationEnvironnementPage";
import { QualificationRisquesPage } from "./features/qualification/pages/QualificationRisquesPage";
import { ResultatsPage } from "./features/resultats/pages/ResultatsPage";
import { DocumentationIntegrationPage } from "./features/documentation/pages/DocumentationIntegrationPage";
import { StatistiquesPage } from "./features/statistiques/pages/StatistiquesPage";
import { MultisitePage } from "./features/partenaires/core/pages/MultisitePage";
import { PartenairesPage } from "./features/partenaires/core/pages/PartenairesPage";
import { DonneesUtiliseesPage } from "./features/donnees-utilisees/pages/DonneesUtiliseesPage";
import { DocumentationSourcesPage } from "./features/documentation-sources/pages/DocumentationSourcesPage";
import { MentionsLegalesPage } from "./features/legal/pages/MentionsLegalesPage";
import { PolitiqueConfidentialitePage } from "./features/legal/pages/PolitiqueConfidentialitePage";
import { AccessibilitePage } from "./features/legal/pages/AccessibilitePage";

function AppContent() {
  const { track } = useEventTracking();
  const hasTrackedVisit = useRef(false);
  const { isReady } = useIframe();

  // Tracker la visite une seule fois
  useEffect(() => {
    if (!isReady) return;
    if (hasTrackedVisit.current) return;

    hasTrackedVisit.current = true;
    track(TypeEvenement.VISITE);
  }, [track, isReady]);

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Landing page */}
        <Route path={ROUTES.HOME} element={<LandingPage />} />

        {/* Parcours principal */}
        <Route path={ROUTES.ANALYSER} element={<AnalyserPage />} />
        <Route path={ROUTES.ENRICHISSEMENT} element={<EnrichissementPage />} />
        <Route path={ROUTES.QUALIFICATION_SITE} element={<QualificationSitePage />} />
        <Route
          path={ROUTES.QUALIFICATION_ENVIRONNEMENT}
          element={<QualificationEnvironnementPage />}
        />
        <Route path={ROUTES.QUALIFICATION_RISQUES} element={<QualificationRisquesPage />} />
        <Route path={ROUTES.RESULTATS} element={<ResultatsPage />} />

        {/* Statistiques */}
        <Route path={ROUTES.STATISTIQUES} element={<StatistiquesPage />} />

        {/* Documentation */}
        <Route path={ROUTES.DOCUMENTATION_INTEGRATION} element={<DocumentationIntegrationPage />} />

        {/* Statut technique */}
        <Route path={ROUTES.DONNEES_UTILISEES} element={<DonneesUtiliseesPage />} />
        <Route path={ROUTES.DOCUMENTATION_SOURCES} element={<DocumentationSourcesPage />} />

        {/* Pages légales */}
        <Route path={ROUTES.MENTIONS_LEGALES} element={<MentionsLegalesPage />} />
        <Route path={ROUTES.POLITIQUE_CONFIDENTIALITE} element={<PolitiqueConfidentialitePage />} />
        <Route path={ROUTES.ACCESSIBILITE} element={<AccessibilitePage />} />

        {/* Partenaires */}
        <Route path={ROUTES.PARTENAIRES} element={<PartenairesPage />} />
        <Route path={ROUTES.PARTENAIRE_DETAIL} element={<MultisitePage />} />

        {/* Routes pour les tests */}
        <Route path={ROUTES.TESTS} element={<Tests />} />
        <Route path={ROUTES.TEST_IFRAME} element={<TestIframe />} />
        <Route path={ROUTES.TEST_CALLBACK} element={<TestCallback />} />
        <Route path={ROUTES.TEST_DIAGNOSTIC_PARCELLE} element={<DiagnosticParcellePage />} />
        <Route path={ROUTES.TEST_RESOLUTION_IDU} element={<ResolutionIduPage />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <IframeProvider>
      <FormProvider>
        <AppContent />
      </FormProvider>
    </IframeProvider>
  );
}

export default App;
