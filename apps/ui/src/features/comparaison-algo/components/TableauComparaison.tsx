import React from "react";
import type { ComparaisonMutabiliteOutputDto, UsageResultat } from "@mutafriches/shared-types";
import { getUsageInfo, getBadgeConfig } from "../../resultats/utils/usagesLabels.utils";
import "../../resultats/components/ResultTable.css";

interface TableauComparaisonProps {
  resultats: ComparaisonMutabiliteOutputDto;
  versionCourante: string;
}

function formatRang(rang: number): string {
  if (rang === 1) return "1er";
  return `${rang}e`;
}

function getDeltaStyle(delta: number): React.CSSProperties {
  if (delta > 0) return { color: "#2e7d32", fontWeight: 600 };
  if (delta < 0) return { color: "#c62828", fontWeight: 600 };
  return { color: "#666" };
}

function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta.toFixed(1)}`;
  if (delta < 0) return delta.toFixed(1);
  return "=";
}

export const TableauComparaison: React.FC<TableauComparaisonProps> = ({
  resultats,
  versionCourante,
}) => {
  const versions = Object.keys(resultats);

  // Utiliser l'ordre des usages de la version courante (par rang)
  const resultatsRef =
    resultats[versionCourante]?.resultats ?? Object.values(resultats)[0]?.resultats ?? [];
  const usages = resultatsRef.map((r: UsageResultat) => r.usage);

  return (
    <div className="fr-table fr-table--bordered">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table>
              <caption>
                Comparaison des versions de l'algorithme
                <div className="fr-table__caption__desc">
                  Résultats de mutabilité calculés avec chaque version
                </div>
              </caption>
              <thead>
                <tr>
                  <th scope="col">Usage</th>
                  {versions.map((v) => (
                    <th key={v} scope="col" style={{ textAlign: "center" }}>
                      {v}
                      {v === versionCourante && (
                        <span className="fr-badge fr-badge--sm fr-badge--info fr-ml-1v">
                          actuel
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usages.map((usage: string) => {
                  const indiceRef = resultats[versionCourante]?.resultats?.find(
                    (r: UsageResultat) => r.usage === usage,
                  )?.indiceMutabilite;

                  return (
                    <tr key={usage}>
                      <td>
                        <strong>{getUsageInfo(usage).label}</strong>
                      </td>
                      {versions.map((v) => {
                        const resultat = resultats[v]?.resultats?.find(
                          (r: UsageResultat) => r.usage === usage,
                        );
                        const indice = resultat?.indiceMutabilite ?? 0;
                        const rang = resultat?.rang ?? 0;
                        const badgeConfig = getBadgeConfig(indice);
                        const delta =
                          indiceRef != null && v !== versionCourante ? indice - indiceRef : 0;

                        return (
                          <td key={v}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                marginBottom: "0.25rem",
                              }}
                            >
                              <strong style={{ minWidth: "1.5rem" }}>{formatRang(rang)}</strong>
                              <div className="result-table__bar-container" style={{ flex: 1 }}>
                                <div
                                  className="result-table__bar"
                                  style={{
                                    backgroundColor: badgeConfig.backgroundColor,
                                    width: `${indice}%`,
                                  }}
                                />
                                <span className="result-table__percentage">
                                  <strong>{Math.round(indice)}%</strong>
                                </span>
                              </div>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.375rem",
                              }}
                            >
                              <span
                                className="result-table__badge"
                                style={{
                                  color: badgeConfig.textColor,
                                  backgroundColor: badgeConfig.backgroundColor,
                                }}
                              >
                                {badgeConfig.label}
                              </span>
                              {v !== versionCourante && indiceRef != null && delta !== 0 && (
                                <span className="fr-text--xs" style={getDeltaStyle(delta)}>
                                  {formatDelta(delta)}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td>
                    <strong>Fiabilité</strong>
                  </td>
                  {versions.map((v) => {
                    const fiabilite = resultats[v]?.fiabilite;
                    return (
                      <td key={v}>
                        <strong>{fiabilite ? `${fiabilite.note}/10` : "-"}</strong>
                        {fiabilite && (
                          <span className="fr-text--xs fr-ml-1v" style={{ color: "#666" }}>
                            ({fiabilite.criteresRenseignes}/{fiabilite.criteresTotal} critères)
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
