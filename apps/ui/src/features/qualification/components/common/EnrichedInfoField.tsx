import React, { useState, useRef, useEffect } from "react";
import { EnrichedBadge } from "./EnrichedBadge";

interface EnrichedInfoFieldProps {
  /** Identifiant unique du champ */
  id: string;
  /** Label du champ */
  label: string;
  /** Valeur affichee */
  value: string;
  /** Contenu du tooltip */
  tooltip?: React.ReactNode;
  /** Source de la donnee */
  source?: string;
}

/**
 * Champ d'affichage d'une donnee enrichie (lecture seule)
 * Avec badge "Donnee enrichie" et tooltip optionnel
 */
export const EnrichedInfoField: React.FC<EnrichedInfoFieldProps> = ({
  id,
  label,
  value,
  tooltip,
  source,
}) => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Fermer le tooltip quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsTooltipOpen(false);
      }
    };

    if (isTooltipOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTooltipOpen]);

  return (
    <div className="fr-col-12 fr-col-md-6">
      <div className="fr-input-group">
        <label className="fr-label" htmlFor={id}>
          {label}
          <EnrichedBadge source={source} />
          {tooltip && (
            <span style={{ position: "relative", display: "inline-block" }} ref={tooltipRef}>
              <button
                type="button"
                className="fr-btn--tooltip fr-btn"
                aria-describedby={`tooltip-${id}`}
                onClick={() => setIsTooltipOpen(!isTooltipOpen)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "0 0.25rem",
                  minHeight: "auto",
                }}
              >
                <span className="fr-icon-information-line fr-icon--sm" aria-hidden="true"></span>
              </button>
              {isTooltipOpen && (
                <span
                  className="fr-tooltip fr-placement"
                  id={`tooltip-${id}`}
                  role="tooltip"
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: "0",
                    zIndex: 1000,
                    display: "block",
                    padding: "0.75rem",
                    background: "var(--background-default-grey)",
                    border: "1px solid var(--border-default-grey)",
                    borderRadius: "4px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    minWidth: "250px",
                    maxWidth: "350px",
                    fontSize: "0.875rem",
                  }}
                >
                  {tooltip}
                </span>
              )}
            </span>
          )}
        </label>
        <input
          className="fr-input"
          type="text"
          id={id}
          name={id}
          value={value}
          disabled
          readOnly
          style={{ backgroundColor: "var(--background-contrast-grey)" }}
        />
      </div>
    </div>
  );
};
