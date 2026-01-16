import { UsageResultat } from "@mutafriches/shared-types";
import React from "react";
import { getUsageInfo, getBadgeConfig } from "../utils/usagesLabels.utils";
import "./ResultTable.css";

interface ResultsTableProps {
  results: UsageResultat[];
}

/**
 * Tableau complet des résultats de mutabilité pour tous les usages
 */
export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  return (
    <div className="fr-mt-4w">
      <div className="fr-table fr-table--bordered">
        <div className="fr-table__wrapper">
          <div className="fr-table__container">
            <div className="fr-table__content">
              <table>
                <caption>
                  Tous les usages
                  <div className="fr-table__caption__desc">
                    Vous trouverez ici la liste complète des usages analysés et une première
                    approche de leur compatibilité avec les caractéristiques de votre site.
                  </div>
                </caption>

                <thead>
                  <tr>
                    <th scope="col">Rang</th>
                    <th scope="col">Usage</th>
                    <th scope="col">Indice de mutabilité</th>
                    <th scope="col">Potentiel</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => {
                    const badgeConfig = getBadgeConfig(result.indiceMutabilite);
                    return (
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
                          <strong>{getUsageInfo(result.usage).label}</strong>
                        </td>
                        <td>
                          <div className="result-table__bar-container">
                            <div
                              className="result-table__bar"
                              style={{
                                backgroundColor: badgeConfig.backgroundColor,
                                width: `${result.indiceMutabilite}%`,
                              }}
                            />
                            <span className="result-table__percentage">
                              <strong>{Math.round(result.indiceMutabilite)}%</strong>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className="result-table__badge"
                            style={{
                              color: badgeConfig.textColor,
                              backgroundColor: badgeConfig.backgroundColor,
                            }}
                          >
                            {badgeConfig.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
