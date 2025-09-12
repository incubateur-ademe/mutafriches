import { useState } from "react";
import { TestCaseSelector } from "../../components/mutability-test/TestCaseSelector";
import { MutabilityForm } from "../../components/mutability-test/MutabilityForm";
import { TestCase, MutabilityResultDto } from "@mutafriches/shared-types";
import { apiService } from "../../services/api/api.service";
import { Layout } from "../../layouts";

export default function TestMutability() {
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [mutabilityResult, setMutabilityResult] = useState<MutabilityResultDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (formData: any) => {
    setIsCalculating(true);
    setError(null);
    setMutabilityResult(null);

    try {
      const result = await apiService.calculerMutabilite(formData);
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
      <div className="fr-container fr-py-4w">
        <div className="fr-grid-row">
          <div className="fr-col-12">
            <h1 className="fr-h2 fr-mb-4w">Test de l'algorithme de mutabilité</h1>

            <div className="fr-alert fr-alert--info fr-mb-4w">
              <p>
                Cette page permet de tester l'algorithme de calcul de mutabilité avec des cas de
                test prédéfinis ou en saisissant manuellement les données d'une friche.
              </p>
            </div>

            {/* Sélecteur de cas de test */}
            <div className="fr-mb-6w">
              <TestCaseSelector
                onTestCaseSelected={setSelectedTestCase}
                selectedTestCase={selectedTestCase}
              />
            </div>

            {/* Affichage du cas sélectionné */}
            {selectedTestCase && (
              <div className="fr-callout fr-callout--green-emeraude fr-mb-4w">
                <h3 className="fr-callout__title">Cas de test sélectionné</h3>
                <p className="fr-callout__text">
                  <strong>{selectedTestCase.name}</strong>
                  <br />
                  {selectedTestCase.description}
                </p>
                <p className="fr-text--sm fr-mb-0">
                  Source : {selectedTestCase.source} | Version algorithme :{" "}
                  {selectedTestCase.algorithmVersion}
                </p>
              </div>
            )}

            {/* Formulaire de saisie */}
            <div className="fr-mb-6w">
              <MutabilityForm
                selectedTestCase={selectedTestCase}
                onFormSubmit={handleFormSubmit}
                isLoading={isCalculating}
              />
            </div>

            {/* Affichage des erreurs */}
            {error && (
              <div className="fr-alert fr-alert--error fr-mb-4w">
                <h3 className="fr-alert__title">Erreur lors du calcul</h3>
                <p>{error}</p>
              </div>
            )}

            {/* Affichage des résultats */}
            {mutabilityResult && (
              <div className="fr-card fr-p-4w fr-mb-6w">
                <div className="fr-card__body">
                  <h2 className="fr-card__title fr-mb-3w">Résultats du calcul de mutabilité</h2>

                  {/* Résultats basiques - en attendant le composant dédié */}
                  <div className="fr-grid-row fr-grid-row--gutters">
                    <div className="fr-col-12">
                      <h3 className="fr-h6">Classement des usages :</h3>
                      <div className="fr-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Rang</th>
                              <th>Usage</th>
                              <th>Indice de mutabilité</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mutabilityResult.resultats?.map((usage, index) => (
                              <tr key={index}>
                                <td>{usage.rang}</td>
                                <td>{usage.usage}</td>
                                <td>{usage.indiceMutabilite}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Données brutes pour debug */}
                  <details className="fr-mt-4w">
                    <summary className="fr-text--sm">Voir les données brutes (debug)</summary>
                    <pre className="fr-text--xs fr-mt-2w">
                      {JSON.stringify(mutabilityResult, null, 2)}
                    </pre>
                  </details>

                  {/* Comparaison avec résultats attendus si cas de test */}
                  {selectedTestCase && (
                    <div className="fr-mt-4w">
                      <h3 className="fr-h6">Comparaison avec les résultats attendus :</h3>
                      <div className="fr-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Usage</th>
                              <th>Calculé</th>
                              <th>Attendu</th>
                              <th>Écart</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedTestCase.expected.usages.map((expectedUsage) => {
                              const calculatedUsage = mutabilityResult.resultats?.find(
                                (u) => u.usage === expectedUsage.usage,
                              );
                              const ecart = calculatedUsage
                                ? calculatedUsage.indiceMutabilite - expectedUsage.indiceMutabilite
                                : null;

                              return (
                                <tr key={expectedUsage.usage}>
                                  <td>{expectedUsage.usage}</td>
                                  <td>{calculatedUsage?.indiceMutabilite || "N/A"}%</td>
                                  <td>{expectedUsage.indiceMutabilite}%</td>
                                  <td
                                    className={ecart && Math.abs(ecart) > 5 ? "fr-text--error" : ""}
                                  >
                                    {ecart !== null
                                      ? `${ecart > 0 ? "+" : ""}${ecart.toFixed(1)}%`
                                      : "N/A"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
