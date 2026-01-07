import { Routes, Route } from "react-router-dom";
import { ROUTES } from "./shared/config/routes.config";
import { Tests } from "./features/tests/pages/TestsPage";
import { TestEnrichment } from "./features/tests/test-enrichissement/pages/TestEnrichment";
import { IframeProvider } from "./shared/iframe/IframeProvider";
import { FormProvider } from "./shared/form/FormProvider";
import { TestCarteParcelle } from "./features/tests/test-carte/pages/TestCarteParcelle";
import { TestMutability } from "./features/tests/test-mutabilite/pages/TestMutability";
import { TestIframe } from "./features/tests/test-iframe/pages/TestIframe";
import { TestCallback } from "./features/tests/test-iframe/pages/TestCallback";
import { useEventTracking } from "./shared/hooks/useEventTracking";
import { useEffect, useRef } from "react";
import { TypeEvenement } from "@mutafriches/shared-types";
import { useIframe } from "./shared/iframe/useIframe";
import { DocumentationIntegrationPage } from "./features/doc/pages/DocumentationIntegrationPage";

// Nouvelles pages
import { HomePage } from "./features/home/pages/HomePage";
import { EnrichissementPage } from "./features/enrichissement/pages/EnrichissementPage";
import { QualificationSitePage } from "./features/qualification/pages/QualificationSitePage";
import { QualificationEnvironnementPage } from "./features/qualification/pages/QualificationEnvironnementPage";
import { QualificationRisquesPage } from "./features/qualification/pages/QualificationRisquesPage";
import { ResultatsPage } from "./features/resultats/pages/ResultatsPage";

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
    <IframeProvider>
      <FormProvider>
        <Routes>
          {/* Parcours principal */}
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.ENRICHISSEMENT} element={<EnrichissementPage />} />
          <Route path={ROUTES.QUALIFICATION_SITE} element={<QualificationSitePage />} />
          <Route
            path={ROUTES.QUALIFICATION_ENVIRONNEMENT}
            element={<QualificationEnvironnementPage />}
          />
          <Route path={ROUTES.QUALIFICATION_RISQUES} element={<QualificationRisquesPage />} />
          <Route path={ROUTES.RESULTATS} element={<ResultatsPage />} />

          {/* Documentation */}
          <Route
            path={ROUTES.DOCUMENTATION_INTEGRATION}
            element={<DocumentationIntegrationPage />}
          />

          {/* Routes pour les tests */}
          <Route path={ROUTES.TESTS} element={<Tests />} />
          <Route path={ROUTES.TEST_CARTE_PARCELLE} element={<TestCarteParcelle />} />
          <Route path={ROUTES.TEST_ENRICHISSEMENT} element={<TestEnrichment />} />
          <Route path={ROUTES.TEST_MUTABILITE} element={<TestMutability />} />
          <Route path={ROUTES.TEST_IFRAME} element={<TestIframe />} />
          <Route path={ROUTES.TEST_CALLBACK} element={<TestCallback />} />
        </Routes>
      </FormProvider>
    </IframeProvider>
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
