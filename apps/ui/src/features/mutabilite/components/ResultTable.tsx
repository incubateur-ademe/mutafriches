import { UsageResultat } from "@mutafriches/shared-types";
import React from "react";
import { getUsageInfo } from "../utils/usages.mapper";

interface ResultsTableProps {
  results: UsageResultat[];
}

/**
 * Tableau complet des résultats de mutabilité pour tous les usages
 */
export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  // Déterminer la couleur selon le rang
  const getBarColor = (rang: number): string => {
    if (rang <= 2) return "#18753c"; // Vert pour top 2
    if (rang <= 4) return "#0078f3"; // Bleu pour 3-4
    if (rang <= 5) return "#666666"; // Gris pour 5
    return "#ce614a"; // Orange pour 6-7
  };

  // Déterminer le badge selon le rang
  const getBadgeClass = (rang: number): string => {
    if (rang <= 2) return "fr-badge--success";
    if (rang <= 4) return "fr-badge--info";
    if (rang >= 6) return "fr-badge--warning";
    return "";
  };

  // Déterminer le potentiel selon l'indice
  const getPotentiel = (indice: number): string => {
    if (indice >= 70) return "Excellent";
    if (indice >= 60) return "Très bon";
    if (indice >= 50) return "Bon";
    if (indice >= 40) return "Moyen";
    if (indice >= 30) return "Faible";
    return "Très faible";
  };

  return (
    <div className="fr-accordions-group fr-mt-4w">
      <section className="fr-accordion">
        <h4 className="fr-accordion__title">
          <button className="fr-accordion__btn" aria-expanded="false" aria-controls="full-results">
            Voir tous les usages et leur compatibilité
          </button>
        </h4>
        <div className="fr-collapse" id="full-results">
          <div className="fr-table fr-table--bordered">
            <div className="fr-table__wrapper">
              <div className="fr-table__container">
                <div className="fr-table__content">
                  <table>
                    <caption>Classement des usages par pourcentage de compatibilité</caption>
                    <thead>
                      <tr>
                        <th scope="col">Rang</th>
                        <th scope="col">Usage</th>
                        <th scope="col">Indice de mutabilité</th>
                        <th scope="col">Potentiel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result) => (
                        <tr key={result.usage}>
                          <td>
                            <strong>
                              {result.rang === 1 && "1er"}
                              {result.rang === 2 && "2e"}
                              {result.rang === 3 && "3e"}
                              {result.rang > 3 && `${result.rang}e`}
                            </strong>
                          </td>
                          <td>
                            <strong className={result.rang <= 3 ? "" : ""}>
                              {getUsageInfo(result.usage).label}
                            </strong>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div
                                style={{
                                  background: getBarColor(result.rang),
                                  height: "8px",
                                  width: `${result.indiceMutabilite}%`,
                                  borderRadius: "4px",
                                  minWidth: "10px",
                                }}
                              />
                              <span style={{ fontWeight: result.rang <= 3 ? "bold" : "normal" }}>
                                {result.indiceMutabilite}%
                              </span>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`fr-badge ${getBadgeClass(result.rang)} fr-badge--no-icon`}
                            >
                              {getPotentiel(result.indiceMutabilite)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
