import { UsageResultat } from "@mutafriches/shared-types";
import React from "react";
import { getUsageInfo, getBadgeConfig } from "../utils/usagesLabels.utils";
import "./ResultTable.css";

interface ResultsTableProps {
  results: UsageResultat[];
  /** Ouvre la modale de détail pour l'usage cliqué */
  onVoirDetail?: (result: UsageResultat) => void;
}

/**
 * Tableau complet des résultats de mutabilité pour tous les usages
 */
export const ResultsTable: React.FC<ResultsTableProps> = ({ results, onVoirDetail }) => {
  return (
    <div className="fr-mt-2w">
      <h4 className="fr-mb-1w">Tous les usages</h4>
      <div className="fr-table fr-table--bordered fr-table--no-caption">
        <div className="fr-table__wrapper">
          <div className="fr-table__container">
            <div className="fr-table__content">
              <table>
                <caption>Tous les usages</caption>
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
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span
                              className="result-table__badge"
                              style={{
                                color: badgeConfig.textColor,
                                backgroundColor: badgeConfig.backgroundColor,
                              }}
                            >
                              {badgeConfig.label}
                            </span>
                            {onVoirDetail && (
                              <button
                                type="button"
                                className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-question-line"
                                title={`Voir le détail de l'usage ${getUsageInfo(result.usage).label}`}
                                onClick={() => onVoirDetail(result)}
                              >
                                Voir le détail
                              </button>
                            )}
                          </div>
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
