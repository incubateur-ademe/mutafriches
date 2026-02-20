import React from "react";

interface EnrichedInfoFieldProps {
  /** Identifiant unique du champ */
  id: string;
  /** Label du champ */
  label: string;
  /** Valeur affichée (chaîne unique ou tableau pour badges multiples) */
  value?: string | string[];
  /** Source de la donnée (optionnel) */
  source?: string;
  /** Contenu du tooltip */
  tooltip?: React.ReactNode;
}

const NON_ACCESSIBLE_LABEL = "Donnée non accessible";

/**
 * Champ d'affichage d'une donnee enrichie (lecture seule)
 * Avec badge "Donnee enrichie" et tooltip optionnel
 * Affiche un badge different si la donnee n'est pas accessible (valeur vide)
 */
export const EnrichedInfoField: React.FC<EnrichedInfoFieldProps> = ({
  id,
  label,
  value,
  tooltip,
}) => {
  const values = Array.isArray(value) ? value : [value];
  const isNonAccessible =
    !value ||
    (typeof value === "string" && (value === NON_ACCESSIBLE_LABEL || value === "-")) ||
    (Array.isArray(value) && value.length === 0);

  return (
    <div className="fr-col-12 fr-col-md-6">
      <div className="fr-input-group">
        <label className="fr-label fr-mb-2v" htmlFor={id}>
          <strong>{label}</strong>
          <button
            aria-describedby={`${id}-tooltip`}
            type="button"
            className="fr-btn--tooltip fr-btn"
          >
            infobulle
          </button>
          <span className="fr-tooltip fr-placement" id={`${id}-tooltip`} role="tooltip">
            {tooltip}
          </span>
        </label>
        {isNonAccessible ? (
          <p className="fr-badge fr-badge--yellow-tournesol fr-icon-close-circle-line fr-badge--icon-left">
            {NON_ACCESSIBLE_LABEL}
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {values.map((v, index) => (
              <p
                key={index}
                className="fr-badge fr-badge--green-emeraude fr-icon-checkbox-line fr-badge--icon-left"
              >
                {v}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
