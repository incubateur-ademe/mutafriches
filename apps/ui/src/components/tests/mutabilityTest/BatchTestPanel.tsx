import { useState, useEffect } from "react";
import {
  TestCase,
  MutabiliteOutputDto,
  UsageResultatDetaille,
  getTestCaseNames,
  getTestCaseById,
} from "@mutafriches/shared-types";

interface BatchTestPanelProps {
  onRunTest: (testCase: TestCase) => Promise<MutabiliteOutputDto>;
}

interface TestResult {
  testCaseId: string;
  testCaseName: string;
  status: "pending" | "running" | "success" | "warning" | "error";
  result?: MutabiliteOutputDto;
  error?: string;
  maxEcart?: number;
  avgEcart?: number;
  ecarts?: Array<{
    usage: string;
    ecart: number;
    calculé: number;
    attendu: number;
  }>;
  startTime?: number;
  duration?: number;
}

export function BatchTestPanel({ onRunTest }: BatchTestPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Initialiser les résultats avec tous les cas de test
  useEffect(() => {
    const testCases = getTestCaseNames();
    const initialResults: TestResult[] = testCases.map((tc) => ({
      testCaseId: tc.id,
      testCaseName: tc.name,
      status: "pending",
    }));
    setTestResults(initialResults);
  }, []);

  const runAllTests = async () => {
    setIsRunning(true);
    setIsPaused(false);
    setCurrentTestIndex(0);

    const testCases = getTestCaseNames();

    for (let i = 0; i < testCases.length; i++) {
      if (isPaused) {
        break;
      }

      setCurrentTestIndex(i);
      const testCase = getTestCaseById(testCases[i].id);

      if (!testCase) continue;

      // Marquer le test comme en cours
      setTestResults((prev) =>
        prev.map((tr, idx) =>
          idx === i ? { ...tr, status: "running" as const, startTime: Date.now() } : tr,
        ),
      );

      try {
        // Exécuter le test
        const result = await onRunTest(testCase);

        // Calculer les écarts
        const ecarts = (result.resultats as UsageResultatDetaille[]).map((r) => {
          const expected = testCase.expected?.usages?.find((e: any) => e.usage === r.usage);
          return {
            usage: r.usage,
            ecart: expected ? Math.abs(r.indiceMutabilite - expected.indiceMutabilite) : 0,
            calculé: r.indiceMutabilite,
            attendu: expected?.indiceMutabilite || 0,
          };
        });

        const maxEcart = Math.max(...ecarts.map((e) => e.ecart));
        const avgEcart = ecarts.reduce((a, b) => a + b.ecart, 0) / ecarts.length;

        // Déterminer le statut
        let status: TestResult["status"] = "success";
        if (maxEcart >= 5) {
          status = "error";
        } else if (maxEcart >= 2) {
          status = "warning";
        }

        // Mettre à jour le résultat
        setTestResults((prev) =>
          prev.map((tr, idx) =>
            idx === i
              ? {
                  ...tr,
                  status,
                  result,
                  maxEcart,
                  avgEcart,
                  ecarts,
                  duration: Date.now() - (tr.startTime || Date.now()),
                }
              : tr,
          ),
        );
      } catch (error) {
        // En cas d'erreur
        setTestResults((prev) =>
          prev.map((tr, idx) =>
            idx === i
              ? {
                  ...tr,
                  status: "error" as const,
                  error: error instanceof Error ? error.message : "Erreur inconnue",
                  duration: Date.now() - (tr.startTime || Date.now()),
                }
              : tr,
          ),
        );
      }

      // Petite pause entre les tests pour ne pas surcharger
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setIsRunning(false);
  };

  const handlePause = () => {
    setIsPaused(true);
    setIsRunning(false);
  };

  const handleResume = async () => {
    setIsPaused(false);
    setIsRunning(true);
    // Reprendre où on s'était arrêté
    const testCases = getTestCaseNames();

    for (let i = currentTestIndex; i < testCases.length; i++) {
      if (isPaused) {
        break;
      }

      setCurrentTestIndex(i);
      const testCase = getTestCaseById(testCases[i].id);

      if (!testCase || testResults[i].status !== "pending") continue;

      // Même logique que runAllTests
      setTestResults((prev) =>
        prev.map((tr, idx) =>
          idx === i ? { ...tr, status: "running" as const, startTime: Date.now() } : tr,
        ),
      );

      try {
        const result = await onRunTest(testCase);

        const ecarts = (result.resultats as UsageResultatDetaille[]).map((r) => {
          const expected = testCase.expected?.usages?.find((e: any) => e.usage === r.usage);
          return {
            usage: r.usage,
            ecart: expected ? Math.abs(r.indiceMutabilite - expected.indiceMutabilite) : 0,
            calculé: r.indiceMutabilite,
            attendu: expected?.indiceMutabilite || 0,
          };
        });

        const maxEcart = Math.max(...ecarts.map((e) => e.ecart));
        const avgEcart = ecarts.reduce((a, b) => a + b.ecart, 0) / ecarts.length;

        let status: TestResult["status"] = "success";
        if (maxEcart >= 5) {
          status = "error";
        } else if (maxEcart >= 2) {
          status = "warning";
        }

        setTestResults((prev) =>
          prev.map((tr, idx) =>
            idx === i
              ? {
                  ...tr,
                  status,
                  result,
                  maxEcart,
                  avgEcart,
                  ecarts,
                  duration: Date.now() - (tr.startTime || Date.now()),
                }
              : tr,
          ),
        );
      } catch (error) {
        setTestResults((prev) =>
          prev.map((tr, idx) =>
            idx === i
              ? {
                  ...tr,
                  status: "error" as const,
                  error: error instanceof Error ? error.message : "Erreur inconnue",
                  duration: Date.now() - (tr.startTime || Date.now()),
                }
              : tr,
          ),
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentTestIndex(0);
    setTestResults((prev) =>
      prev.map((tr) => ({
        testCaseId: tr.testCaseId,
        testCaseName: tr.testCaseName,
        status: "pending" as const,
      })),
    );
  };

  // Calcul des statistiques globales
  const stats = {
    total: testResults.length,
    success: testResults.filter((r) => r.status === "success").length,
    warning: testResults.filter((r) => r.status === "warning").length,
    error: testResults.filter((r) => r.status === "error").length,
    pending: testResults.filter((r) => r.status === "pending").length,
    running: testResults.filter((r) => r.status === "running").length,
    avgDuration:
      testResults.filter((r) => r.duration).reduce((sum, r) => sum + (r.duration || 0), 0) /
        testResults.filter((r) => r.duration).length || 0,
  };

  const progress = ((stats.total - stats.pending - stats.running) / stats.total) * 100;

  return (
    <div className="fr-card fr-py-4w">
      <div className="fr-card__body">
        <h2 className="fr-h5 fr-mb-3w">Test en masse</h2>

        {/* Contrôles */}
        <div className="fr-btns-group fr-mb-3w">
          {!isRunning && !isPaused && (
            <button className="fr-btn fr-btn--primary" onClick={runAllTests}>
              Lancer tous les tests
            </button>
          )}

          {isRunning && !isPaused && (
            <button className="fr-btn fr-btn--secondary" onClick={handlePause}>
              Pause
            </button>
          )}

          {isPaused && (
            <button className="fr-btn fr-btn--primary" onClick={handleResume}>
              Reprendre
            </button>
          )}

          {stats.success + stats.warning + stats.error > 0 && (
            <button className="fr-btn fr-btn--tertiary" onClick={handleReset}>
              Réinitialiser
            </button>
          )}
        </div>

        {/* Barre de progression */}
        {(isRunning || progress > 0) && (
          <div className="fr-mb-3w">
            <div
              className="fr-progress"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span className="fr-progress__bar" style={{ width: `${progress}%` }}></span>
            </div>
            <p className="fr-text--sm fr-mt-1w">
              Progression : {Math.round(progress)}% ({stats.total - stats.pending - stats.running}/
              {stats.total})
            </p>
          </div>
        )}

        {/* Statistiques */}
        {stats.success + stats.warning + stats.error > 0 && (
          <div className="fr-callout fr-mb-3w">
            <h3 className="fr-callout__title">Résumé des tests</h3>
            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-3">
                <p className="fr-text--sm fr-mb-0">
                  <span className="fr-badge fr-badge--success">{stats.success}</span> Succès
                </p>
              </div>
              <div className="fr-col-3">
                <p className="fr-text--sm fr-mb-0">
                  <span className="fr-badge fr-badge--warning">{stats.warning}</span> Avertissements
                </p>
              </div>
              <div className="fr-col-3">
                <p className="fr-text--sm fr-mb-0">
                  <span className="fr-badge fr-badge--error">{stats.error}</span> Erreurs
                </p>
              </div>
              <div className="fr-col-3">
                <p className="fr-text--sm fr-mb-0">
                  Durée moy : {(stats.avgDuration / 1000).toFixed(2)}s
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tableau des résultats */}
        <div className="fr-table">
          <table style={{ width: "100%" }}>
            <caption className="fr-h6">Résultats des tests</caption>
            <thead>
              <tr>
                <th scope="col">Cas de test</th>
                <th scope="col">Statut</th>
                <th scope="col">Écart max</th>
                <th scope="col">Écart moyen</th>
                <th scope="col">Durée</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {testResults.map((result) => (
                <tr key={result.testCaseId}>
                  <td>{result.testCaseId}</td>
                  <td>
                    {result.status === "pending" && (
                      <span className="fr-badge fr-badge--sm">En attente</span>
                    )}
                    {result.status === "running" && (
                      <span className="fr-badge fr-badge--sm fr-badge--info">En cours...</span>
                    )}
                    {result.status === "success" && (
                      <span className="fr-badge fr-badge--sm fr-badge--success">Succès</span>
                    )}
                    {result.status === "warning" && (
                      <span className="fr-badge fr-badge--sm fr-badge--warning">Attention</span>
                    )}
                    {result.status === "error" && (
                      <span className="fr-badge fr-badge--sm fr-badge--error">Erreur</span>
                    )}
                  </td>
                  <td>
                    {result.maxEcart !== undefined ? (
                      <span
                        className={
                          result.maxEcart >= 5
                            ? "fr-text--error"
                            : result.maxEcart >= 2
                              ? "fr-text--warning"
                              : ""
                        }
                      >
                        {result.maxEcart.toFixed(1)}%
                      </span>
                    ) : result.error ? (
                      <span className="fr-text--error">-</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{result.avgEcart !== undefined ? `${result.avgEcart.toFixed(1)}%` : "-"}</td>
                  <td>{result.duration ? `${(result.duration / 1000).toFixed(2)}s` : "-"}</td>
                  <td>
                    {(result.status === "success" ||
                      result.status === "warning" ||
                      result.status === "error") && (
                      <button
                        className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm"
                        onClick={() =>
                          setShowDetails(
                            showDetails === result.testCaseId ? null : result.testCaseId,
                          )
                        }
                      >
                        {showDetails === result.testCaseId ? "Masquer" : "Détails"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Détails du test sélectionné */}
        {showDetails &&
          testResults.find((r) => r.testCaseId === showDetails) &&
          (() => {
            const result = testResults.find((r) => r.testCaseId === showDetails);
            if (!result) return null;

            return (
              <div className="fr-callout fr-mt-3w">
                <h4 className="fr-callout__title">Détails : {result.testCaseId}</h4>

                {result.error ? (
                  <div className="fr-alert fr-alert--error">
                    <p className="fr-alert__title">Erreur d'exécution</p>
                    <p>{result.error}</p>
                  </div>
                ) : (
                  result.ecarts && (
                    <div className="fr-table fr-table--sm">
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
                          {result.ecarts
                            .sort((a, b) => b.ecart - a.ecart)
                            .map((ecart) => (
                              <tr key={ecart.usage}>
                                <td>{ecart.usage}</td>
                                <td>{ecart.calculé}%</td>
                                <td>{ecart.attendu}%</td>
                                <td
                                  className={
                                    ecart.ecart >= 5
                                      ? "fr-text--error fr-text--bold"
                                      : ecart.ecart >= 2
                                        ? "fr-text--warning"
                                        : ""
                                  }
                                >
                                  {ecart.ecart.toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            );
          })()}
      </div>
    </div>
  );
}
