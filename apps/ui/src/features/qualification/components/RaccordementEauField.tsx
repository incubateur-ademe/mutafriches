import React from "react";
import { RaccordementEau } from "@mutafriches/shared-types";
import { Tag } from "@shared/components/tag";

interface RaccordementEauFieldProps {
  /** Valeur dérivée automatiquement de la surface bâtie */
  value: RaccordementEau;
  /** Contenu du tooltip */
  tooltip?: React.ReactNode;
}

const LABELS: Record<RaccordementEau, string> = {
  [RaccordementEau.OUI]: "Oui",
  [RaccordementEau.NON]: "Non",
  [RaccordementEau.NE_SAIT_PAS]: "Non déterminé",
};

const ID = "raccordement-eau";

/**
 * Affichage en lecture seule du raccordement eau, déduit automatiquement de la surface bâtie.
 * Remplace l'ancienne liste déroulante saisie par l'utilisateur.
 */
export const RaccordementEauField: React.FC<RaccordementEauFieldProps> = ({ value, tooltip }) => {
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
        <Tag id={ID} variant="bleu">
          {LABELS[value]}
        </Tag>
      </div>
    </div>
  );
};
