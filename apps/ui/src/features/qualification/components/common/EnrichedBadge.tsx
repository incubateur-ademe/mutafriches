import React from "react";

interface EnrichedBadgeProps {
  /** Texte optionnel a afficher dans le badge */
  label?: string;
  /** Source de la donnee (pour le tooltip) */
  source?: string;
}

/**
 * Badge indiquant qu'une donnee a ete enrichie automatiquement
 */
export const EnrichedBadge: React.FC<EnrichedBadgeProps> = ({
  label = "Donnee enrichie",
  source,
}) => {
  return (
    <span
      className="fr-badge fr-badge--success fr-badge--sm fr-badge--no-icon"
      title={source ? `Source: ${source}` : "Donnee collectee automatiquement"}
      style={{ marginLeft: "0.5rem", verticalAlign: "middle" }}
    >
      {label}
    </span>
  );
};
