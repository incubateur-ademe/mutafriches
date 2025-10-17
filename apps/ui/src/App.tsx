import { Routes, Route } from "react-router-dom";
import { FormProvider, IframeProvider } from "./context";
import { Step1 } from "./features/enrichissement/pages/EnrichmentPage";
import { ROUTES } from "./shared/config/routes.config";
import { Step2 } from "./features/donnees-complementaires/pages/DonneesComplementairesPage";
import { Step3 } from "./features/mutabilite/pages/ResultatsPage";
import { Tests } from "./features/tests/pages/TestsPage";
import { TestCarteParcelle } from "./features/tests/pages/TestCarteParcelle";
import { TestEnrichment } from "./features/tests/pages/TestEnrichment";
import TestMutability from "./features/tests/pages/TestMutability";
import { TestIframe } from "./features/tests/pages/TestIframe";
import { TestCallback } from "./features/tests/pages/TestCallback";

function App() {
  return (
    <IframeProvider>
      <FormProvider>
        <Routes>
          <Route path={ROUTES.HOME} element={<Step1 />} />
          <Route path={ROUTES.STEP1} element={<Step1 />} />
          <Route path={ROUTES.STEP2} element={<Step2 />} />
          <Route path={ROUTES.STEP3} element={<Step3 />} />

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
