import {
  MutabiliteOutputDto,
  UsageResultatDetaille,
  DetailCritere,
} from "@mutafriches/shared-types";
import { useState } from "react";

interface ResultsPanelProps {
  result: MutabiliteOutputDto | null;
  error: string | null;
  isCalculating: boolean;
  expectedResults: any | null;
}

export function ResultsPanel({ result, error, isCalculating, expectedResults }: ResultsPanelProps) {
  const [expandedUsage, setExpandedUsage] = useState<string | null>(null);

  const toggleUsageDetails = (usage: string) => {
    setExpandedUsage(expandedUsage === usage ? null : usage);
  };

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
              {(result.resultats as UsageResultatDetaille[])?.[0]?.detailsCalcul && (
                <span className="fr-badge fr-badge--new fr-ml-1w">Mode détaillé activé</span>
              )}
            </div>

            {/* Indice de fiabilité global */}
            {result.fiabilite && (
              <div className="fr-callout fr-mb-3w">
                <h3 className="fr-callout__title">Indice de fiabilité</h3>
                <p className="fr-callout__text">
                  <strong>{result.fiabilite.note}/10</strong> - {result.fiabilite.text}
                </p>
                <p className="fr-text--sm">{result.fiabilite.description}</p>
                {result.fiabilite.criteresRenseignes !== undefined && (
                  <p className="fr-text--sm fr-mt-1w">
                    Critères renseignés : {result.fiabilite.criteresRenseignes}/
                    {result.fiabilite.criteresTotal}
                  </p>
                )}
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
                    <th scope="col">Avantages</th>
                    <th scope="col">Contraintes</th>
                    {expectedResults && <th scope="col">Attendu</th>}
                    {expectedResults && <th scope="col">Écart</th>}
                    {(result.resultats as UsageResultatDetaille[])?.[0]?.detailsCalcul && (
                      <th scope="col">Détails</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(result.resultats as UsageResultatDetaille[])
                    ?.sort((a, b) => a.rang - b.rang)
                    .map((usage) => {
                      const expected = expectedResults?.usages?.find(
                        (e: any) => e.usage === usage.usage,
                      );
                      const ecart = expected
                        ? usage.indiceMutabilite - expected.indiceMutabilite
                        : null;
                      const isExpanded = expandedUsage === usage.usage;

                      return (
                        <>
                          <tr key={usage.usage}>
                            <td>
                              <span className="fr-badge fr-badge--sm">{usage.rang}</span>
                            </td>
                            <td>{usage.usage}</td>
                            <td>
                              <strong>{usage.indiceMutabilite}%</strong>
                            </td>
                            <td className="fr-text--success">+{usage.avantages}</td>
                            <td className="fr-text--error">-{usage.contraintes}</td>
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
                                {ecart !== null
                                  ? `${ecart > 0 ? "+" : ""}${ecart.toFixed(1)}%`
                                  : "-"}
                              </td>
                            )}
                            {usage.detailsCalcul && (
                              <td>
                                <button
                                  className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-btn--icon-left fr-icon-arrow-down-s-line"
                                  onClick={() => toggleUsageDetails(usage.usage)}
                                  aria-expanded={isExpanded}
                                  aria-controls={`details-${usage.usage}`}
                                >
                                  {isExpanded ? "Masquer" : "Voir"}
                                </button>
                              </td>
                            )}
                          </tr>

                          {/* Ligne de détails extensible */}
                          {usage.detailsCalcul && isExpanded && (
                            <tr id={`details-${usage.usage}`}>
                              <td colSpan={expectedResults ? 9 : 7}>
                                <div className="fr-p-2w fr-background-alt--grey">
                                  <h4 className="fr-h6 fr-mb-2w">
                                    Détails du calcul pour {usage.usage}
                                  </h4>

                                  <div className="fr-grid-row fr-grid-row--gutters">
                                    {/* Colonne Avantages */}
                                    <div className="fr-col-12 fr-col-md-6">
                                      <div className="fr-card fr-card--no-border">
                                        <div className="fr-card__body">
                                          <h5 className="fr-text--md fr-text--bold fr-text--success fr-mb-2w">
                                            Avantages (Total: {usage.detailsCalcul.totalAvantages})
                                          </h5>
                                          {usage.detailsCalcul.detailsAvantages.length > 0 ? (
                                            <div className="fr-table fr-table--sm">
                                              <table>
                                                <thead>
                                                  <tr>
                                                    <th>Critère</th>
                                                    <th>Valeur</th>
                                                    <th>Score</th>
                                                    <th>Poids</th>
                                                    <th>Total</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {usage.detailsCalcul.detailsAvantages.map(
                                                    (detail: DetailCritere, idx: number) => (
                                                      <tr key={idx}>
                                                        <td className="fr-text--sm">
                                                          {detail.critere}
                                                        </td>
                                                        <td className="fr-text--sm">
                                                          {typeof detail.valeur === "boolean"
                                                            ? detail.valeur
                                                              ? "Oui"
                                                              : "Non"
                                                            : String(detail.valeur)}
                                                        </td>
                                                        <td className="fr-text--sm">
                                                          {detail.scoreBrut}
                                                        </td>
                                                        <td className="fr-text--sm">
                                                          ×{detail.poids}
                                                        </td>
                                                        <td className="fr-text--sm fr-text--bold">
                                                          {detail.scorePondere}
                                                        </td>
                                                      </tr>
                                                    ),
                                                  )}
                                                </tbody>
                                              </table>
                                            </div>
                                          ) : (
                                            <p className="fr-text--sm">Aucun avantage identifié</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Colonne Contraintes */}
                                    <div className="fr-col-12 fr-col-md-6">
                                      <div className="fr-card fr-card--no-border">
                                        <div className="fr-card__body">
                                          <h5 className="fr-text--md fr-text--bold fr-text--error fr-mb-2w">
                                            Contraintes (Total:{" "}
                                            {usage.detailsCalcul.totalContraintes})
                                          </h5>
                                          {usage.detailsCalcul.detailsContraintes.length > 0 ? (
                                            <div className="fr-table fr-table--sm">
                                              <table>
                                                <thead>
                                                  <tr>
                                                    <th>Critère</th>
                                                    <th>Valeur</th>
                                                    <th>Score</th>
                                                    <th>Poids</th>
                                                    <th>Total</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {usage.detailsCalcul.detailsContraintes.map(
                                                    (detail: DetailCritere, idx: number) => (
                                                      <tr key={idx}>
                                                        <td className="fr-text--sm">
                                                          {detail.critere}
                                                        </td>
                                                        <td className="fr-text--sm">
                                                          {typeof detail.valeur === "boolean"
                                                            ? detail.valeur
                                                              ? "Oui"
                                                              : "Non"
                                                            : String(detail.valeur)}
                                                        </td>
                                                        <td className="fr-text--sm">
                                                          {detail.scoreBrut}
                                                        </td>
                                                        <td className="fr-text--sm">
                                                          ×{detail.poids}
                                                        </td>
                                                        <td className="fr-text--sm fr-text--bold">
                                                          {detail.scorePondere}
                                                        </td>
                                                      </tr>
                                                    ),
                                                  )}
                                                </tbody>
                                              </table>
                                            </div>
                                          ) : (
                                            <p className="fr-text--sm">
                                              Aucune contrainte identifiée
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Formule de calcul */}
                                  <div className="fr-alert fr-alert--info fr-mt-2w">
                                    <p className="fr-text--sm fr-mb-0">
                                      <strong>Formule :</strong> Indice = Avantages / (Avantages +
                                      Contraintes) × 100
                                      <br />
                                      <strong>Calcul :</strong> {usage.detailsCalcul.totalAvantages}{" "}
                                      / ({usage.detailsCalcul.totalAvantages} +{" "}
                                      {usage.detailsCalcul.totalContraintes}) × 100 ={" "}
                                      {usage.indiceMutabilite}%
                                    </p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
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
                    const ecarts = (result.resultats as UsageResultatDetaille[]).map((r) => {
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
