import React from "react";
import { MutabiliteOutputDto } from "@mutafriches/shared-types";
import { getMutabilityColor, getMutabilityLabel } from "../../utils/debug.helpers";

/** Labels francais pour les types d'usage */
const USAGE_LABELS: Record<string, string> = {
  residentiel: "R\u00E9sidentiel",
  equipements: "\u00C9quipements publics",
  culture: "Culture et loisirs",
  tertiaire: "Tertiaire",
  industrie: "Industrie",
  renaturation: "Renaturation",
  photovoltaique: "Photovolta\u00EFque",
};

interface EvaluationSectionProps {
  mutabilityData: MutabiliteOutputDto | null;
}

export const EvaluationSection: React.FC<EvaluationSectionProps> = ({ mutabilityData }) => {
  if (!mutabilityData) {
    return (
      <details className="debug-panel__section">
        <summary>R&eacute;sultats de l'&eacute;valuation</summary>
        <div className="debug-panel__section-content">
          <p className="fr-text--sm">Aucun r&eacute;sultat d'&eacute;valuation disponible.</p>
        </div>
      </details>
    );
  }

  const { fiabilite, resultats, evaluationId } = mutabilityData;

  return (
    <details className="debug-panel__section">
      <summary>R&eacute;sultats de l'&eacute;valuation</summary>
      <div className="debug-panel__section-content">
        {/* Bloc fiabilite */}
        <div className="debug-panel__fiabilite">
          <div className="debug-panel__fiabilite-score">{fiabilite.note}/10</div>
          <div className="debug-panel__fiabilite-details">
            <strong>{fiabilite.text}</strong>
            <br />
            <span className="fr-text--xs">
              {fiabilite.criteresRenseignes}/{fiabilite.criteresTotal} crit&egrave;res
              renseign&eacute;s
              {fiabilite.poidsRenseignes !== undefined && (
                <>
                  {" "}
                  &mdash; Poids : {fiabilite.poidsRenseignes}/{fiabilite.poidsTotal}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Detail criteres si disponible */}
        {fiabilite.detailCriteres && fiabilite.detailCriteres.length > 0 && (
          <details style={{ marginBottom: "0.75rem", fontSize: "0.8125rem" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.75rem" }}>
              D&eacute;tail des crit&egrave;res de fiabilit&eacute;
            </summary>
            <table className="debug-panel__usage-table" style={{ marginTop: "0.25rem" }}>
              <thead>
                <tr>
                  <th>Crit&egrave;re</th>
                  <th>Poids</th>
                  <th>Renseign&eacute;</th>
                </tr>
              </thead>
              <tbody>
                {fiabilite.detailCriteres.map((c, i) => (
                  <tr key={i}>
                    <td>{c.critere}</td>
                    <td>{c.poids}</td>
                    <td>
                      <span
                        className={`fr-badge fr-badge--sm ${c.renseigne ? "fr-badge--success" : "fr-badge--warning"}`}
                      >
                        {c.renseigne ? "Oui" : "Non"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}

        {/* Tableau des 7 usages */}
        <h4 className="debug-panel__subtitle">Classement des usages</h4>
        <table className="debug-panel__usage-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Usage</th>
              <th>Indice</th>
              <th>Potentiel</th>
            </tr>
          </thead>
          <tbody>
            {resultats.map((r) => (
              <tr key={r.usage}>
                <td>{r.rang}</td>
                <td>{USAGE_LABELS[r.usage] ?? r.usage}</td>
                <td>
                  <div className="debug-panel__score-bar">
                    <div
                      className="debug-panel__score-bar-fill"
                      style={{
                        width: `${Math.max(r.indiceMutabilite, 4)}px`,
                        maxWidth: "80px",
                        backgroundColor: getMutabilityColor(r.indiceMutabilite),
                      }}
                    />
                    <span className="debug-panel__score-bar-value">{r.indiceMutabilite}%</span>
                  </div>
                </td>
                <td>
                  <span
                    className="fr-badge fr-badge--sm"
                    style={{ backgroundColor: getMutabilityColor(r.indiceMutabilite) }}
                  >
                    {r.potentiel ?? getMutabilityLabel(r.indiceMutabilite)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ID evaluation */}
        {evaluationId && (
          <div style={{ marginTop: "0.75rem" }}>
            <dt className="fr-text--xs" style={{ color: "var(--text-mention-grey)" }}>
              ID &eacute;valuation
            </dt>
            <dd style={{ fontFamily: "monospace", fontSize: "0.75rem", wordBreak: "break-all" }}>
              {evaluationId}
            </dd>
          </div>
        )}
      </div>
    </details>
  );
};
