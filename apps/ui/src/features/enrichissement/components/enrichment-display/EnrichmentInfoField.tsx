import React from "react";

interface EnrichmentInfoFieldProps {
  id: string;
  label: string;
  value: string;
  tooltip: string;
}

// Composant pour afficher un champ d'information
export const EnrichmentInfoField: React.FC<EnrichmentInfoFieldProps> = ({
  id,
  label,
  value,
  tooltip,
}: EnrichmentInfoFieldProps) => {
  const isVerified = value !== "Non renseigné";

  return (
    <div className="fr-col-6">
      <div className="fr-text fr-text--lg">
        <strong>{label}</strong>
        <button aria-describedby={`tooltip-${id}`} type="button" className="fr-btn--tooltip fr-btn">
          <span className="fr-icon-information-line" aria-hidden="true"></span>
        </button>
        <span className="fr-tooltip fr-placement" id={`tooltip-${id}`} role="tooltip">
          {tooltip}
        </span>
        <br />
        <span
          className={isVerified ? "fr-badge fr-badge--blue-france" : "fr-badge fr-badge--no-icon"}
        >
          {value}
        </span>
      </div>
    </div>
  );
};
