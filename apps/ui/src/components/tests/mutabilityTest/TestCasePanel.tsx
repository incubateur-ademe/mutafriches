import { TestCase, getTestCaseNames, getTestCaseById } from "@mutafriches/shared-types";

interface TestCasePanelProps {
  selectedTestCase: TestCase | null;
  onTestCaseSelect: (testCase: TestCase | null) => void;
}

export function TestCasePanel({ selectedTestCase, onTestCaseSelect }: TestCasePanelProps) {
  const testCaseOptions = getTestCaseNames();

  console.log("Test case options:", testCaseOptions);

  const handleTestCaseSelect = (testCaseId: string) => {
    if (testCaseId === "") {
      onTestCaseSelect(null);
      return;
    }

    const testCase = getTestCaseById(testCaseId);
    if (testCase) {
      onTestCaseSelect(testCase);
    }
  };

  return (
    <div className="fr-card fr-py-4w">
      <div className="fr-card__body">
        <h2 className="fr-h5 fr-mb-2w">Sélection du cas de test</h2>

        <div className="fr-select-group">
          <label className="fr-label" htmlFor="test-case-select">
            Choisir un cas prédéfini
          </label>
          <select
            className="fr-select"
            id="test-case-select"
            value={selectedTestCase?.id || ""}
            onChange={(e) => handleTestCaseSelect(e.target.value)}
          >
            <option value="">-- Sélectionner un cas de test --</option>
            {testCaseOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        {/* Affichage des détails du cas sélectionné */}
        {selectedTestCase && (
          <div className="fr-callout fr-callout--green-emeraude fr-mt-3w">
            <h3 className="fr-callout__title">{selectedTestCase.name}</h3>
            <p className="fr-callout__text">{selectedTestCase.description}</p>
            <p className="fr-text--sm fr-mb-0">
              <strong>Source :</strong> {selectedTestCase.source}
              <br />
              <strong>Version algorithme :</strong> {selectedTestCase.algorithmVersion}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
