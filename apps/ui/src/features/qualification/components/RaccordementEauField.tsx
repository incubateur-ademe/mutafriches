import React from "react";
import { RaccordementEau } from "@mutafriches/shared-types";

interface RaccordementEauFieldProps {
  /** Valeur dérivée automatiquement de la surface bâtie */
  value: RaccordementEau;
  /** Contenu du tooltip */
  tooltip?: React.ReactNode;
}

const BADGES: Record<RaccordementEau, { label: string; className: string }> = {
  [RaccordementEau.OUI]: {
    label: "Oui",
    className: "fr-badge fr-badge--success fr-icon-checkbox-line fr-badge--icon-left",
  },
  [RaccordementEau.NON]: {
    label: "Non",
    className: "fr-badge fr-badge--info fr-icon-information-line fr-badge--icon-left",
  },
  [RaccordementEau.NE_SAIT_PAS]: {
    label: "Non déterminé",
    className: "fr-badge fr-badge--yellow-tournesol fr-icon-question-line fr-badge--icon-left",
  },
};

const ID = "raccordement-eau";

/**
 * Affichage en lecture seule du raccordement eau, déduit automatiquement de la surface bâtie.
 * Remplace l'ancienne liste déroulante saisie par l'utilisateur.
 */
export const RaccordementEauField: React.FC<RaccordementEauFieldProps> = ({ value, tooltip }) => {
  const badge = BADGES[value];

  return (
    <div className="fr-col-12 fr-col-md-6">
      <div className="fr-input-group">
        <label className="fr-label fr-mb-2v" htmlFor={ID}>
          <strong>Site connecté aux réseaux d'eau</strong>
          {tooltip && (
            <>
              <button
                aria-describedby={`${ID}-tooltip`}
                type="button"
                className="fr-btn--tooltip fr-btn"
              >
                infobulle
              </button>
              <span className="fr-tooltip fr-placement" id={`${ID}-tooltip`} role="tooltip">
                {tooltip}
              </span>
            </>
          )}
        </label>
        <p id={ID} className={badge.className}>
          {badge.label}
        </p>
      </div>
    </div>
  );
};
