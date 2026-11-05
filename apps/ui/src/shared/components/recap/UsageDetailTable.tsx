import React, { useId } from "react";
import { DetailUsageSection } from "@mutafriches/shared-types";
import { ImpactBadge } from "./RecapBadges";
import "./RecapTable.css";

interface UsageDetailTableProps {
  sections: DetailUsageSection[];
}

interface EnTeteInfobulleProps {
  libelle: string;
  texte: string;
}

// Le poids est une magnitude (toujours positif) : pas de signe pour éviter
// de le confondre avec le sens de l'impact (positif/négatif).
function formatPonderation(poids: number): string {
  return poids.toFixed(1);
}

// Id unique par tableau : le panneau de debug en rend une copie, et le DSFR ouvrirait
// l'infobulle de même id, cachée sous la modale.
const EnTeteInfobulle: React.FC<EnTeteInfobulleProps> = ({ libelle, texte }) => {
  const tooltipId = `tooltip-${useId()}`;
  return (
    <span className="inline-flex items-center gap-1">
      {libelle}
      <button aria-describedby={tooltipId} type="button" className="fr-btn--tooltip fr-btn">
        infobulle
      </button>
      <span className="fr-tooltip fr-placement" id={tooltipId} role="tooltip">
        {texte}
      </span>
    </span>
  );
};

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
                    <EnTeteInfobulle
                      libelle="Pondération"
                      texte="Poids du critère dans le calcul de mutabilité."
                    />
                  </th>
                  <th scope="col" className="recap-table__center">
                    <EnTeteInfobulle
                      libelle="Impact"
                      texte="Effet de ce critère sur la compatibilité avec cet usage."
                    />
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
