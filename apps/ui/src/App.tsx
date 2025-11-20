import { Routes, Route } from "react-router-dom";
import { ROUTES } from "./shared/config/routes.config";
import { Step2DonneesComplementairesPage } from "./features/donnees-complementaires/pages/DonneesComplementairesPage";
import { Step3ResultatsPage } from "./features/mutabilite/pages/ResultatsPage";
import { Tests } from "./features/tests/pages/TestsPage";
import { TestEnrichment } from "./features/tests/test-enrichissement/pages/TestEnrichment";
import { IframeProvider } from "./shared/iframe/IframeProvider";
import { FormProvider } from "./shared/form/FormProvider";
import { TestCarteParcelle } from "./features/tests/test-carte/pages/TestCarteParcelle";
import { TestMutability } from "./features/tests/test-mutabilite/pages/TestMutability";
import { TestIframe } from "./features/tests/test-iframe/pages/TestIframe";
import { TestCallback } from "./features/tests/test-iframe/pages/TestCallback";
import { Step1EnrichmentPage } from "./features/enrichissement/pages/EnrichmentPage";
import { useEventTracking } from "./shared/hooks/useEventTracking";
import { useEffect, useRef } from "react";
import { TypeEvenement } from "@mutafriches/shared-types";
import { useIframe } from "./shared/iframe/useIframe";

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
          <Route path={ROUTES.HOME} element={<Step1EnrichmentPage />} />
          <Route path={ROUTES.STEP1} element={<Step1EnrichmentPage />} />
          <Route path={ROUTES.STEP2} element={<Step2DonneesComplementairesPage />} />
          <Route path={ROUTES.STEP3} element={<Step3ResultatsPage />} />

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
