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
import { useEffect } from "react";
import { TypeEvenement } from "@mutafriches/shared-types";

function App() {
  const { track } = useEventTracking();

  useEffect(() => {
    track(TypeEvenement.VISITE);
  }, [track]);

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

export default App;
