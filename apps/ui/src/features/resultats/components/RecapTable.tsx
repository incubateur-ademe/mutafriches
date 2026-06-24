import React from "react";
import { RecapitulatifSection } from "@mutafriches/shared-types";
import { SaisieBadge, SourceBadge } from "./RecapBadges";
import "./RecapTable.css";

interface RecapTableProps {
  sections: RecapitulatifSection[];
}

/**
 * Tableau récapitulatif des critères du site, groupés par section.
 * Présentation pure : les données sont fournies par buildRecapitulatifSite (shared-types).
 */
export const RecapTable: React.FC<RecapTableProps> = ({ sections }) => {
  return (
    <div className="fr-table fr-table--bordered recap-table">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table>
              <caption className="fr-sr-only">Récapitulatif des critères du site</caption>
              <thead>
                <tr>
                  <th scope="col">Critère</th>
                  <th scope="col">Valeur</th>
                  <th scope="col" className="recap-table__center">
                    Saisie
                  </th>
                  <th scope="col" className="recap-table__center">
                    Source
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
                          <SaisieBadge saisie={critere.saisie} />
                        </td>
                        <td className="recap-table__center">
                          {critere.sourceLabel ? <SourceBadge label={critere.sourceLabel} /> : null}
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
