import { Routes, Route } from "react-router-dom";
import { DsfrProvider } from "./providers/dsfr/DsfrProvider";
import { Step1 } from "./pages/Step1";
import { TestDsfr } from "./pages/Home"; // On garde pour les tests

function App() {
  return (
    <DsfrProvider>
      <Routes>
        <Route path="/" element={<Step1 />} />
        <Route path="/step1" element={<Step1 />} />
        <Route path="/test" element={<TestDsfr />} />
        {/* TODO: Ajouter les routes step2 et step3 */}
      </Routes>
    </DsfrProvider>
  );
}

export default App;
