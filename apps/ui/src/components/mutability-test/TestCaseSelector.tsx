import { useState } from "react";
import { TestCase, getTestCaseNames, getTestCaseById } from "@mutafriches/shared-types";

interface TestCaseSelectorProps {
  onTestCaseSelected: (testCase: TestCase | null) => void;
  selectedTestCase: TestCase | null;
}

export function TestCaseSelector({ onTestCaseSelected, selectedTestCase }: TestCaseSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const testCaseOptions = getTestCaseNames();

  const handleTestCaseSelect = (testCaseId: string) => {
    if (testCaseId === "") {
      onTestCaseSelected(null);
      return;
    }

    const testCase = getTestCaseById(testCaseId);
    if (testCase) {
      onTestCaseSelected(testCase);
    }
  };

  return (
    <div className="fr-card fr-p-4w">
      <div className="fr-card__body">
        <h2 className="fr-card__title fr-mb-3w">Sélection d'un cas de test</h2>

        <div className="fr-select-group fr-mb-3w">
          <label className="fr-label" htmlFor="test-case-select">
            Choisir un cas de test prédéfini
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
          <p className="fr-hint-text">
            Les cas de test permettent de valider l'algorithme avec des données connues
          </p>
        </div>

        {/* Bouton pour afficher/masquer les détails */}
        {testCaseOptions.length > 0 && (
          <button
            className="fr-btn fr-btn--secondary fr-btn--sm"
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Masquer" : "Voir"} la liste des cas disponibles
          </button>
        )}

        {/* Liste détaillée des cas de test */}
        {isExpanded && (
          <div className="fr-mt-3w">
            <h3 className="fr-h6 fr-mb-2w">Cas de test disponibles :</h3>
            <div className="fr-accordions-group">
              {testCaseOptions.map((option) => (
                <section key={option.id} className="fr-accordion">
                  <h3 className="fr-accordion__title">
                    <button
                      className="fr-accordion__btn"
                      type="button"
                      aria-expanded="false"
                      aria-controls={`accordion-${option.id}`}
                    >
                      {option.name}
                    </button>
                  </h3>
                  <div className="fr-collapse" id={`accordion-${option.id}`}>
                    <div className="fr-accordion__body">
                      <div className="fr-accordion__inner">
                        <p className="fr-text--sm fr-mb-2w">{option.description}</p>
                        <button
                          className="fr-btn fr-btn--primary fr-btn--sm"
                          type="button"
                          onClick={() => handleTestCaseSelect(option.id)}
                        >
                          Sélectionner ce cas
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
