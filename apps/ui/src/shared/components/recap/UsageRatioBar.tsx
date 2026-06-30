import React from "react";

interface UsageRatioBarProps {
  avantages: number;
  contraintes: number;
  /** Si fourni, affiche la ligne de compatibilité (indice) au-dessus de la barre. */
  indice?: number;
}

/**
 * Barre avantages / contraintes d'un usage (style de la modale de détail).
 * Présentation pure : la part d'avantages est dérivée des deux totaux.
 */
export const UsageRatioBar: React.FC<UsageRatioBarProps> = ({ avantages, contraintes, indice }) => {
  const total = avantages + contraintes;
  const partAvantages = total > 0 ? (avantages / total) * 100 : 0;

  return (
    <>
      {indice !== undefined && (
        <p className="fr-mb-1w fr-mt-3w">
          <strong>{Math.round(indice)} % de compatibilité</strong>{" "}
          <span style={{ fontWeight: 400 }}>Indice = avantages / (avantages + contraintes)</span>
        </p>
      )}
      {/* Barre bicolore sur mesure (avantages/contraintes), non couverte par le DSFR */}
      <div
        className={indice === undefined ? "fr-mt-3w" : ""}
        style={{
          display: "flex",
          height: "10px",
          borderRadius: "5px",
          overflow: "hidden",
          backgroundColor: "var(--background-contrast-grey)",
        }}
      >
        <div style={{ width: `${partAvantages}%`, backgroundColor: "#B8FEC9" }} />
        <div style={{ flex: 1, backgroundColor: "#FFBDBE" }} />
      </div>
      <div
        className="fr-mb-3w fr-mt-1w"
        style={{ display: "flex", justifyContent: "space-between" }}
      >
        <span className="fr-text--sm">Avantages : {avantages.toFixed(1)}</span>
        <span className="fr-text--sm">Contraintes : {contraintes.toFixed(1)}</span>
      </div>
    </>
  );
};
