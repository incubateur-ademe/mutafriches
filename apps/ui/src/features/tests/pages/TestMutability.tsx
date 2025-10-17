import { useState } from "react";
import {
  MutabiliteOutputDto,
  TestCase,
  convertTestCaseToMutabilityInput,
} from "@mutafriches/shared-types";
import { buildCalculerMutabiliteFromFormData } from "../../donnees-complementaires/utils/form-to-dto.mapper";
import { apiService } from "../../../shared/services/api/api.service";
import { Layout } from "../../../shared/components/layout/Layout";
import {
  InputDataPanel,
  ModeSelector,
  ResultsPanel,
  TestCasePanel,
} from "../components/mutability-test";
import { BatchTestPanel } from "../components/mutability-test/BatchTestPanel";

type Mode = "test-case" | "manual" | "batch-test";
type InputMode = "locked" | "editable";

export default function TestMutability() {
  const [mode, setMode] = useState<Mode>("batch-test");
  const [inputMode, setInputMode] = useState<InputMode>("locked");
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [mutabilityResult, setMutabilityResult] = useState<MutabiliteOutputDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    if (newMode === "manual") {
      setSelectedTestCase(null);
      setFormData({});
      setInputMode("editable");
    } else if (newMode === "test-case") {
      setInputMode("locked");
    }
    // Pour batch-test, on garde l'état actuel mais on réinitialise les résultats
    setMutabilityResult(null);
    setError(null);
  };

  const handleTestCaseSelect = (testCase: TestCase | null) => {
    setSelectedTestCase(testCase);
    if (testCase) {
      // Convertir les données du cas de test pour obtenir les données enrichies
      const convertedData = convertTestCaseToMutabilityInput(testCase);

      // Pour le formulaire, on utilise directement les données du test case
      const flatFormData = {
        // Données enrichies issues de la conversion
        identifiantParcelle: convertedData.donneesEnrichies.identifiantParcelle,
        commune: convertedData.donneesEnrichies.commune,
        surfaceSite: convertedData.donneesEnrichies.surfaceSite,
        surfaceBati: convertedData.donneesEnrichies.surfaceBati,
        siteEnCentreVille: convertedData.donneesEnrichies.siteEnCentreVille,
        distanceAutoroute: convertedData.donneesEnrichies.distanceAutoroute,
        distanceTransportCommun: convertedData.donneesEnrichies.distanceTransportCommun,
        distanceRaccordementElectrique:
          convertedData.donneesEnrichies.distanceRaccordementElectrique,
        proximiteCommercesServices: convertedData.donneesEnrichies.proximiteCommercesServices,
        tauxLogementsVacants: convertedData.donneesEnrichies.tauxLogementsVacants,
        presenceRisquesTechnologiques: convertedData.donneesEnrichies.presenceRisquesTechnologiques,
        presenceRisquesNaturels: testCase.input.presenceRisquesNaturels,
        zonageEnvironnemental: testCase.input.zonageEnvironnemental,
        zonageReglementaire: testCase.input.zonageReglementaire,
        zonagePatrimonial: testCase.input.zonagePatrimonial,
        trameVerteEtBleue: testCase.input.trameVerteEtBleu,

        // Données complémentaires directement du test case
        typeProprietaire: testCase.input.typeProprietaire,
        raccordementEau:
          testCase.input.raccordementEau === true
            ? "oui"
            : testCase.input.raccordementEau === false
              ? "non"
              : testCase.input.raccordementEau,
        etatBatiInfrastructure: mapEtatBati(testCase.input.etatBatiInfrastructure),
        presencePollution: testCase.input.presencePollution,
        valeurArchitecturaleHistorique: testCase.input.valeurArchitecturaleHistorique,
        qualitePaysage: testCase.input.qualitePaysage,
        qualiteVoieDesserte: testCase.input.qualiteVoieDesserte,
      };

      setFormData(flatFormData);
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
      // Préparer les données à envoyer en fonction du mode
      const dataToSend =
        selectedTestCase && inputMode === "locked"
          ? convertTestCaseToMutabilityInput(selectedTestCase)
          : buildCalculerMutabiliteFromFormData(formData);

      const result = await apiService.calculerMutabilite(dataToSend, {
        modeDetaille: true,
        sansEnrichissement: true, // Pas d'enrichissement pour les tests
      });

      setMutabilityResult(result);
    } catch (error) {
      console.error("Erreur lors du calcul:", error);
      setError(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsCalculating(false);
    }
  };

  // Fonction pour exécuter un test en mode batch
  const handleRunBatchTest = async (testCase: TestCase): Promise<MutabiliteOutputDto> => {
    try {
      const dataToSend = convertTestCaseToMutabilityInput(testCase);

      const result = await apiService.calculerMutabilite(dataToSend, {
        modeDetaille: true,
        sansEnrichissement: true,
      });

      return result;
    } catch (error) {
      console.error(`Erreur lors du test ${testCase.id}:`, error);
      throw error;
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
                Testez l'algorithme avec des cas prédéfinis, en saisissant manuellement les données,
                ou en exécutant tous les tests en masse
              </p>
            </div>
          </div>
        </div>

        {/* Sélecteur de mode */}
        <div className="fr-container fr-mb-4w">
          <ModeSelector mode={mode} onModeChange={handleModeChange} />
        </div>

        {/* Contenu principal */}
        <div className="fr-container">
          {/* Mode Test en masse */}
          {mode === "batch-test" && (
            <div className="fr-grid-row">
              <div className="fr-col-12">
                <BatchTestPanel onRunTest={handleRunBatchTest} />
              </div>
            </div>
          )}

          {/* Modes Test unitaire et Manuel */}
          {(mode === "test-case" || mode === "manual") && (
            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12">
                <div style={{ minHeight: "600px" }}>
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
                  <div className="fr-mb-3w">
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

                  {/* Panneau Résultats */}
                  <div style={{ minHeight: "600px" }}>
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
          )}
        </div>
      </div>
    </Layout>
  );
}

/**
 * Mappe les valeurs spéciales de etatBatiInfrastructure
 */
function mapEtatBati(value: string): string {
  const mapping: Record<string, string> = {
    "batiments-heterogenes": "degradation-heterogene",
    "batiments-homogenes": "degradation-moyenne",
    "absence-batiments": "degradation-inexistante",
  };
  return mapping[value] || value;
}
