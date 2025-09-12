import { useState } from "react";
import {
  TestCase,
  MutabilityResultDto,
  convertTestCaseToMutabilityInput,
} from "@mutafriches/shared-types";
import { apiService } from "../../services/api/api.service";
import { Layout } from "../../layouts";
import { ModeSelector } from "../../components/tests/mutabilityTest/ModeSelector";
import { TestCasePanel } from "../../components/tests/mutabilityTest/TestCasePanel";
import { InputDataPanel } from "../../components/tests/mutabilityTest/InputDataPanel";
import { ResultsPanel } from "../../components/tests/mutabilityTest/ResultPanel";

type Mode = "test-case" | "manual";
type InputMode = "locked" | "editable";

export default function TestMutability() {
  const [mode, setMode] = useState<Mode>("test-case");
  const [inputMode, setInputMode] = useState<InputMode>("locked");
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [mutabilityResult, setMutabilityResult] = useState<MutabilityResultDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    if (newMode === "manual") {
      setSelectedTestCase(null);
      setFormData({});
      setInputMode("editable");
    } else {
      setInputMode("locked");
    }
    setMutabilityResult(null);
    setError(null);
  };

  const handleTestCaseSelect = (testCase: TestCase | null) => {
    setSelectedTestCase(testCase);
    if (testCase) {
      // Convertir les données du cas de test en données de formulaire
      const convertedData = convertTestCaseToMutabilityInput(testCase);
      setFormData(convertedData);
      setInputMode("locked");
    } else {
      setFormData({});
    }
    setMutabilityResult(null);
    setError(null);
  };

  const handleInputModeChange = (newInputMode: InputMode) => {
    setInputMode(newInputMode);
  };

  const handleFormDataChange = (newFormData: any) => {
    setFormData(newFormData);
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    setError(null);
    setMutabilityResult(null);

    try {
      const result = await apiService.calculerMutabilite(formData, { modeDetaille: true }); // Toujours en mode détaillé pour les tests
      setMutabilityResult(result);
    } catch (error) {
      console.error("Erreur lors du calcul:", error);
      setError(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Layout>
      <div className="fr-container-fluid fr-background-alt--grey fr-py-4w">
        {/* En-tête */}
        <div className="fr-container">
          <div className="fr-grid-row">
            <div className="fr-col-12">
              <h1 className="fr-h2 fr-mb-2w">Test de l'algorithme de mutabilité</h1>
              <p className="fr-text--lead fr-mb-4w">
                Testez l'algorithme avec des cas prédéfinis ou en saisissant manuellement les
                données
              </p>
            </div>
          </div>
        </div>

        {/* Sélecteur de mode */}
        <div className="fr-container fr-mb-4w">
          <ModeSelector mode={mode} onModeChange={handleModeChange} />
        </div>

        {/* Contenu principal avec layout en 2 colonnes */}
        <div className="fr-container-fluid">
          <div className="fr-grid-row fr-grid-row--gutters">
            {/* Colonne gauche : Sélection et données d'entrée */}
            <div className="fr-col-12 fr-col-lg-6">
              <div className="fr-p-3w" style={{ minHeight: "600px" }}>
                {/* Panneau de sélection du cas de test (uniquement en mode test-case) */}
                {mode === "test-case" && (
                  <div className="fr-mb-3w">
                    <TestCasePanel
                      selectedTestCase={selectedTestCase}
                      onTestCaseSelect={handleTestCaseSelect}
                    />
                  </div>
                )}

                {/* Panneau des données d'entrée */}
                <InputDataPanel
                  mode={mode}
                  inputMode={inputMode}
                  formData={formData}
                  onFormDataChange={handleFormDataChange}
                  onInputModeChange={handleInputModeChange}
                  onCalculate={handleCalculate}
                  isCalculating={isCalculating}
                  hasData={mode === "manual" || selectedTestCase !== null}
                />
              </div>
            </div>

            {/* Colonne droite : Résultats */}
            <div className="fr-col-12 fr-col-lg-6">
              <div className="fr-p-3w" style={{ minHeight: "600px" }}>
                <ResultsPanel
                  result={mutabilityResult}
                  error={error}
                  isCalculating={isCalculating}
                  expectedResults={selectedTestCase?.expected || null}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
