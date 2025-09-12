import { Routes, Route } from "react-router-dom";
import { DsfrProvider } from "./providers/dsfr/DsfrProvider";
import { Step1 } from "./pages/Step1";
import { FormProvider } from "./context/FormProvider";
import { Step2 } from "./pages/Step2";
import { ROUTES } from "./config/routes/routes.config";
import { Step3 } from "./pages/Step3";
import { useEffect } from "react";
import { STORAGE_KEY } from "./context/FormContext.types";
import { Tests } from "./pages/Tests";
import { TestDsfr } from "./pages/tests/TestDsfr";
import TestMutability from "./pages/tests/TestMutability";
import { TestEnrichment } from "./pages/tests/TestEnrichment";

function App() {
  // Gestion du reset du formulaire si on arrive sur la home
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath === "/" || currentPath === ROUTES.HOME) {
      const hasData = localStorage.getItem(STORAGE_KEY);
      if (hasData) {
        const stored = JSON.parse(hasData);
        if (stored.completedSteps?.length > 0) {
          // Il y a des données en cours, ne pas reset automatiquement
          return;
        }
      }
    }
  }, []);

  return (
    <DsfrProvider>
      <FormProvider>
        <Routes>
          <Route path={ROUTES.HOME} element={<Step1 />} />
          <Route path={ROUTES.STEP1} element={<Step1 />} />
          <Route path={ROUTES.STEP2} element={<Step2 />} />
          <Route path={ROUTES.STEP3} element={<Step3 />} />

          {/* Routes pour les tests */}
          <Route path={ROUTES.TESTS} element={<Tests />} />
          <Route path={ROUTES.TEST_DSFR} element={<TestDsfr />} />
          <Route path={ROUTES.TEST_ENRICHISSEMENT} element={<TestEnrichment />} />
          <Route path={ROUTES.TEST_MUTABILITE} element={<TestMutability />} />
        </Routes>
      </FormProvider>
    </DsfrProvider>
  );
}

export default App;
