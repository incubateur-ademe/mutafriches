import React, { useState } from "react";
import { createLogger } from "vite";

interface GeoRisquesTableProps {
  data: Record<string, unknown>;
}

interface FlattenedRow {
  key: string;
  value: string;
}

export const GeoRisquesTable: React.FC<GeoRisquesTableProps> = ({ data }) => {
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());

  if (!data) {
    return <p className="fr-text--sm">Aucune donnée GéoRisques disponible</p>;
  }

  const toggleAccordion = (fieldName: string) => {
    setExpandedAccordions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fieldName)) {
        newSet.delete(fieldName);
      } else {
        newSet.add(fieldName);
      }
      return newSet;
    });
  };

  const fiabiliteValue =
    typeof data.fiabilite === "number"
      ? data.fiabilite
      : typeof data.metadata === "object" &&
          data.metadata !== null &&
          !Array.isArray(data.metadata) &&
          typeof (data.metadata as Record<string, unknown>).fiabilite === "number"
        ? ((data.metadata as Record<string, unknown>).fiabilite as number)
        : null;

  const metadata: Record<string, unknown> = {};
  const fields: Record<string, unknown> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (key === "fiabilite") {
      // Ne rien faire, déjà extrait dans fiabiliteValue
    } else if (key === "sourcesUtilisees" || key === "sourcesEchouees") {
      metadata[key] = value;
    } else if (
      key === "metadata" &&
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      Object.entries(value as Record<string, unknown>).forEach(([metaKey, metaValue]) => {
        if (metaKey !== "fiabilite") {
          // Filtrer la fiabilité du metadata
          metadata[metaKey] = metaValue;
        }
      });
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      fields[key] = value;
    }
  });

  const flattenObject = (obj: Record<string, unknown>, prefix = ""): FlattenedRow[] => {
    const result: FlattenedRow[] = [];

    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (value === null || value === undefined) {
        result.push({ key: fullKey, value: "null" });
      } else if (Array.isArray(value)) {
        if (value.length === 0) {
          result.push({ key: fullKey, value: "[]" });
        } else if (value.every((item) => typeof item !== "object")) {
          result.push({ key: fullKey, value: value.join(", ") });
        } else {
          result.push({ key: fullKey, value: `Array(${value.length})` });
          value.forEach((item, index) => {
            if (typeof item === "object" && item !== null) {
              result.push(
                ...flattenObject(item as Record<string, unknown>, `${fullKey}[${index}]`),
              );
            } else {
              result.push({ key: `${fullKey}[${index}]`, value: String(item) });
            }
          });
        }
      } else if (typeof value === "object" && !Array.isArray(value)) {
        result.push(...flattenObject(value as Record<string, unknown>, fullKey));
      } else {
        result.push({ key: fullKey, value: String(value) });
      }
    });

    return result;
  };

  const formatLabel = (key: string): string => {
    const labels: Record<string, string> = {
      sourcesUtilisees: "Sources utilisées",
      sourcesEchouees: "Sources échouées",
      fiabilite: "Fiabilité",
    };
    return labels[key] || key;
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "null";
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "number") return value.toLocaleString("fr-FR");
    if (Array.isArray(value)) {
      if (value.length === 0) return "Aucune";
      return value.join(", ");
    }
    return String(value);
  };

  const renderValueBadges = (value: unknown) => {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <p className="fr-badge fr-badge--success">Aucune</p>;
      }
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {value.map((item, index) => (
            <p key={index} className="fr-badge fr-badge--new">
              {String(item)}
            </p>
          ))}
        </div>
      );
    }

    const badgeClass = getBadgeClass(value);
    if (badgeClass) {
      return <p className={badgeClass}>{formatValue(value)}</p>;
    }
    return <p className="fr-text--sm">{formatValue(value)}</p>;
  };

  const getBadgeClass = (value: unknown): string => {
    if (value === null || value === undefined) return "fr-badge fr-badge--warning";
    if (typeof value === "boolean") {
      return value ? "fr-badge fr-badge--success" : "fr-badge fr-badge--error";
    }
    if (typeof value === "number") return "fr-badge fr-badge--info";
    if (Array.isArray(value)) {
      return value.length === 0 ? "fr-badge fr-badge--success" : "fr-badge fr-badge--new";
    }
    return "";
  };

  return (
    <div>
      {Object.keys(metadata).length > 0 && (
        <div className="fr-mb-4w">
          <div className="fr-grid-row fr-grid-row--gutters">
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key} className="fr-col-12 fr-col-md-6">
                <div className="fr-card fr-card--no-border">
                  <div className="fr-card__body">
                    <div className="fr-card__content">
                      <h4 className="fr-card__title">{formatLabel(key)}</h4>
                      <div className="fr-card__desc">{renderValueBadges(value)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {fiabiliteValue !== null && (
        <div className="fr-mb-4w">
          <h5>Fiabilité</h5>
          <div
            className={`fr-callout ${
              fiabiliteValue >= 8
                ? "fr-callout--green-emeraude"
                : fiabiliteValue >= 6
                  ? "fr-callout--blue-ecume"
                  : fiabiliteValue >= 4
                    ? "fr-callout--yellow-moutarde"
                    : "fr-callout--pink-tuile"
            }`}
          >
            <p className="fr-callout__text">
              <strong style={{ fontSize: "1.5rem" }}>{fiabiliteValue}/10</strong>
              <br />
              <span className="fr-text--sm">
                {fiabiliteValue >= 8 && "Excellent - Données très fiables"}
                {fiabiliteValue >= 6 && fiabiliteValue < 8 && "Bon - Données fiables"}
                {fiabiliteValue >= 4 && fiabiliteValue < 6 && "Moyen - Quelques données manquantes"}
                {fiabiliteValue < 4 && "Faible - Beaucoup de données manquantes"}
              </span>
            </p>
          </div>
        </div>
      )}

      {Object.keys(fields).length > 0 && (
        <div className="fr-mt-4w">
          <h3 className="fr-h5 fr-mb-2w">Données détaillées par source</h3>
          {Object.entries(fields).map(([fieldName, fieldData]) => {
            const rows = flattenObject(fieldData as Record<string, unknown>);
            const isExpanded = expandedAccordions.has(fieldName);

            return (
              <section key={fieldName} className="fr-accordion fr-mb-2w">
                <h3 className="fr-accordion__title">
                  <button
                    type="button"
                    className="fr-accordion__btn"
                    aria-expanded={isExpanded}
                    aria-controls={`accordion-${fieldName}`}
                    onClick={() => toggleAccordion(fieldName)}
                  >
                    {fieldName}
                    <span className="fr-badge fr-badge--sm fr-badge--info fr-ml-1w">
                      {rows.length} propriété{rows.length > 1 ? "s" : ""}
                    </span>
                  </button>
                </h3>
                <div
                  className="fr-collapse"
                  id={`accordion-${fieldName}`}
                  style={{ display: isExpanded ? "block" : "none" }}
                >
                  <div className="fr-table">
                    <div className="fr-table__wrapper">
                      <div className="fr-table__container">
                        <div className="fr-table__content">
                          <table>
                            <caption className="fr-sr-only">Données {fieldName}</caption>
                            <thead>
                              <tr>
                                <th scope="col" style={{ width: "40%" }}>
                                  Propriété
                                </th>
                                <th scope="col">Valeur</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((row, index) => (
                                <tr key={`${fieldName}-${index}`}>
                                  <th scope="row" style={{ fontWeight: "normal" }}>
                                    <code
                                      style={{
                                        fontSize: "0.875rem",
                                        backgroundColor: "#f6f6f6",
                                        padding: "0.125rem 0.25rem",
                                        borderRadius: "0.25rem",
                                      }}
                                    >
                                      {row.key}
                                    </code>
                                  </th>
                                  <td>
                                    {row.value.length > 200 ? (
                                      <details>
                                        <summary
                                          style={{ cursor: "pointer", fontSize: "0.875rem" }}
                                        >
                                          {row.value.substring(0, 200)}...{" "}
                                          <span className="fr-badge fr-badge--sm">Voir plus</span>
                                        </summary>
                                        <pre
                                          style={{
                                            fontSize: "0.75rem",
                                            whiteSpace: "pre-wrap",
                                            wordBreak: "break-word",
                                            backgroundColor: "#f6f6f6",
                                            padding: "0.5rem",
                                            borderRadius: "0.25rem",
                                            marginTop: "0.5rem",
                                          }}
                                        >
                                          {row.value}
                                        </pre>
                                      </details>
                                    ) : (
                                      <span style={{ fontSize: "0.875rem" }}>{row.value}</span>
                                    )}
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
            );
          })}
        </div>
      )}

      {Object.keys(fields).length === 0 && Object.keys(metadata).length === 0 && (
        <div className="fr-callout fr-callout--warning">
          <p className="fr-callout__text">Structure non reconnue. Affichage du JSON brut :</p>
          <pre
            style={{
              backgroundColor: "#f6f6f6",
              padding: "1rem",
              borderRadius: "0.25rem",
              overflow: "auto",
              maxHeight: "600px",
              fontSize: "0.75rem",
            }}
          >
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
