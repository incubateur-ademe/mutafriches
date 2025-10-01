import { Routes, Route } from "react-router-dom";
import { Step1 } from "./pages/Step1";
import { FormProvider, IframeProvider } from "./context";
import { Step2 } from "./pages/Step2";
import { ROUTES } from "./config/routes/routes.config";
import { Step3 } from "./pages/Step3";
import { Tests } from "./pages/Tests";
import { TestCarteParcelle } from "./pages/tests/TestCarteParcelle";
import TestMutability from "./pages/tests/TestMutability";
import { TestEnrichment } from "./pages/tests/TestEnrichment";
import { TestIframe } from "./pages/tests/TestIframe";
import { TestCallback } from "./pages/tests/TestCallback";

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
