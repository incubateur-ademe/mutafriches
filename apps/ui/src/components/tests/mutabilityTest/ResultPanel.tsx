import { MutabilityResultDto } from "@mutafriches/shared-types";

interface ResultsPanelProps {
  result: MutabilityResultDto | null;
  error: string | null;
  isCalculating: boolean;
  expectedResults: any | null;
}

export function ResultsPanel({ result, error, isCalculating, expectedResults }: ResultsPanelProps) {
  return (
    <div className="fr-card fr-py-4w">
      <div className="fr-card__body">
        <h2 className="fr-h5 fr-mb-3w">Résultats du calcul</h2>

        {/* État d'attente */}
        {!result && !error && !isCalculating && (
          <div className="fr-alert fr-alert--info">
            <p className="fr-alert__title">En attente de calcul</p>
            <p>Configurez les données d'entrée et lancez le calcul pour voir les résultats</p>
          </div>
        )}

        {/* Calcul en cours */}
        {isCalculating && (
          <div className="fr-alert">
            <p className="fr-alert__title">Calcul en cours...</p>
            <p>L'algorithme analyse les données de la friche</p>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="fr-alert fr-alert--error">
            <h3 className="fr-alert__title">Erreur lors du calcul</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Résultats */}
        {result && (
          <>
            {/* Badge de statut */}
            <div className="fr-mb-3w">
              <span className="fr-badge fr-badge--success">Calcul terminé</span>
              {expectedResults && (
                <span className="fr-badge fr-badge--info fr-ml-1w">Avec comparaison</span>
              )}
            </div>

            {/* Indice de fiabilité global */}
            {result.fiabilite && (
              <div className="fr-callout fr-mb-3w">
                <h3 className="fr-callout__title">Indice de fiabilité</h3>
                <p className="fr-callout__text">
                  <strong>{result.fiabilite.note}/10</strong>
                </p>
              </div>
            )}

            {/* Tableau des résultats */}
            <div className="fr-table fr-mb-3w">
              <table>
                <caption className="fr-h6">Classement des usages par mutabilité</caption>
                <thead>
                  <tr>
                    <th scope="col">Rang</th>
                    <th scope="col">Usage</th>
                    <th scope="col">Indice</th>
                    {expectedResults && <th scope="col">Attendu</th>}
                    {expectedResults && <th scope="col">Écart</th>}
                  </tr>
                </thead>
                <tbody>
                  {result.resultats
                    ?.sort((a, b) => a.rang - b.rang)
                    .map((usage) => {
                      const expected = expectedResults?.usages?.find(
                        (e: any) => e.usage === usage.usage,
                      );
                      const ecart = expected
                        ? usage.indiceMutabilite - expected.indiceMutabilite
                        : null;

                      return (
                        <tr key={usage.usage}>
                          <td>
                            <span className="fr-badge fr-badge--sm">{usage.rang}</span>
                          </td>
                          <td>{usage.usage}</td>
                          <td>
                            <strong>{usage.indiceMutabilite}%</strong>
                          </td>
                          {expectedResults && <td>{expected?.indiceMutabilite || "-"}%</td>}
                          {expectedResults && (
                            <td
                              className={
                                ecart !== null && Math.abs(ecart) > 5
                                  ? "fr-text--error"
                                  : ecart !== null && Math.abs(ecart) > 2
                                    ? "fr-text--warning"
                                    : ""
                              }
                            >
                              {ecart !== null ? `${ecart > 0 ? "+" : ""}${ecart.toFixed(1)}%` : "-"}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Analyse de la comparaison si cas de test */}
            {expectedResults && result.resultats && (
              <div className="fr-alert fr-alert--info fr-mb-3w">
                <h4 className="fr-alert__title">Analyse de la comparaison</h4>
                <p>
                  {(() => {
                    const ecarts = result.resultats.map((r) => {
                      const expected = expectedResults.usages?.find(
                        (e: any) => e.usage === r.usage,
                      );
                      return expected
                        ? Math.abs(r.indiceMutabilite - expected.indiceMutabilite)
                        : 0;
                    });
                    const maxEcart = Math.max(...ecarts);
                    const avgEcart = ecarts.reduce((a, b) => a + b, 0) / ecarts.length;

                    if (maxEcart < 2) {
                      return "Excellent : tous les résultats correspondent aux valeurs attendues";
                    } else if (maxEcart < 5) {
                      return `Bon : écart moyen de ${avgEcart.toFixed(1)}%`;
                    } else {
                      return `À vérifier : écart maximum de ${maxEcart.toFixed(1)}%`;
                    }
                  })()}
                </p>
              </div>
            )}

            {/* Données brutes pour debug */}
            <details className="fr-mt-3w">
              <summary className="fr-text--sm">Données brutes (debug)</summary>
              <pre
                className="fr-text--xs fr-mt-2w"
                style={{
                  maxHeight: "200px",
                  overflow: "auto",
                  backgroundColor: "#f6f6f6",
                  padding: "1rem",
                  borderRadius: "4px",
                }}
              >
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </>
        )}
      </div>
    </div>
  );
}
