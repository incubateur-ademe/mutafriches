import { Routes, Route, Navigate } from "react-router-dom";
import { DsfrProvider } from "./providers/dsfr/DsfrProvider";
import { Step1 } from "./pages/Step1";
import { TestDsfr } from "./pages/Debug";
import { FormProvider } from "./context/FormProvider";
import { Step2 } from "./pages/Step2";
import { ROUTES } from "./config/routes/routes.config";
import { Step3 } from "./pages/Step3";

function App() {
  return (
    <DsfrProvider>
      <FormProvider>
        <Routes>
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.STEP1} replace />} />
          <Route path={ROUTES.STEP1} element={<Step1 />} />
          <Route path={ROUTES.STEP2} element={<Step2 />} />
          <Route path={ROUTES.STEP3} element={<Step3 />} />
          <Route path={ROUTES.DEBUG} element={<TestDsfr />} />
        </Routes>
      </FormProvider>
    </DsfrProvider>
  );
}

export default App;
