import { Routes, Route } from "react-router-dom";
import { DsfrProvider } from "./providers/dsfr/DsfrProvider";
import { Step1 } from "./pages/Step1";
import { TestDsfr } from "./pages/Debug";

function App() {
  return (
    <DsfrProvider>
      <Routes>
        <Route path="/" element={<Step1 />} />
        <Route path="/debug" element={<TestDsfr />} />
        {/* TODO: Ajouter les routes step2 et step3 */}
      </Routes>
    </DsfrProvider>
  );
}

export default App;
