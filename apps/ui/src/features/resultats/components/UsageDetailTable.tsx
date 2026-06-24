import React from "react";
import { DetailUsageSection } from "@mutafriches/shared-types";
import { ImpactBadge } from "./RecapBadges";
import "./RecapTable.css";

interface UsageDetailTableProps {
  sections: DetailUsageSection[];
}

function formatPonderation(poids: number): string {
  return `+${poids.toFixed(1)}`;
}

/**
 * Tableau du détail d'un usage : critère, valeur, pondération et impact,
 * groupés par section. Présentation pure (données = buildDetailUsage).
 */
export const UsageDetailTable: React.FC<UsageDetailTableProps> = ({ sections }) => {
  return (
    <div className="fr-table fr-table--bordered recap-table">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table>
              <caption className="fr-sr-only">Détail des critères pour cet usage</caption>
              <thead>
                <tr>
                  <th scope="col">Critère</th>
                  <th scope="col">Valeur</th>
                  <th scope="col" className="recap-table__center">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                      Pondération
                      <button
                        aria-describedby="tooltip-ponderation"
                        type="button"
                        className="fr-btn--tooltip fr-btn"
                      >
                        infobulle
                      </button>
                      <span
                        className="fr-tooltip fr-placement"
                        id="tooltip-ponderation"
                        role="tooltip"
                      >
                        Poids du critère dans le calcul de mutabilité.
                      </span>
                    </span>
                  </th>
                  <th scope="col" className="recap-table__center">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                      Impact
                      <button
                        aria-describedby="tooltip-impact"
                        type="button"
                        className="fr-btn--tooltip fr-btn"
                      >
                        infobulle
                      </button>
                      <span className="fr-tooltip fr-placement" id="tooltip-impact" role="tooltip">
                        Effet de ce critère sur la compatibilité avec cet usage.
                      </span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section) => (
                  <React.Fragment key={section.id}>
                    <tr>
                      <th scope="colgroup" colSpan={4} className="recap-table__section-title">
                        {section.titre}
                      </th>
                    </tr>
                    {section.criteres.map((critere) => (
                      <tr key={critere.key}>
                        <td>{critere.label}</td>
                        <td>
                          <strong>{critere.valeurAffichee}</strong>
                        </td>
                        <td className="recap-table__center">
                          <strong>{formatPonderation(critere.poids)}</strong>
                        </td>
                        <td className="recap-table__center">
                          <ImpactBadge impact={critere.impact} />
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
