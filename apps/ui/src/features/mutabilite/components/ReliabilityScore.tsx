import React from "react";

interface ReliabilityScoreProps {
  note: number;
  text: string;
  description: string;
}

/**
 * Composant pour afficher le score de fiabilité des résultats
 */
export const ReliabilityScore: React.FC<ReliabilityScoreProps> = ({ note, text, description }) => {
  // Déterminer la couleur selon le score
  const getScoreColor = (score: number): string => {
    if (score >= 8) return "#18753c"; // Vert
    if (score >= 6) return "#0078f3"; // Bleu
    if (score >= 4) return "#ff9940"; // Orange
    return "#ce614a"; // Rouge
  };

  return (
    <div className="fr-callout fr-callout--green-emeraude fr-mb-4w">
      <h4 className="fr-callout__title">🎯 Indice de fiabilité global</h4>
      <div className="fr-callout__text">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: getScoreColor(note),
            }}
          >
            {note}/10
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: "bold" }}>{text}</p>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
