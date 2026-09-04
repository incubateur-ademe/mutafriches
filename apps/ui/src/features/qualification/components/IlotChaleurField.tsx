import React from "react";
import { IlotChaleurUrbain } from "@mutafriches/shared-types";

interface IlotChaleurFieldProps {
  /** Valeur enrichie depuis la cartographie ICU du CSTB */
  value?: IlotChaleurUrbain;
  /** Contenu du tooltip */
  tooltip?: React.ReactNode;
}

const BADGES: Record<IlotChaleurUrbain, { label: string; className: string }> = {
  [IlotChaleurUrbain.OUI]: {
    label: "Oui (+ de 5,5 °C)",
    className: "fr-badge fr-badge--green-emeraude fr-icon-warning-line fr-badge--icon-left",
  },
  [IlotChaleurUrbain.NON]: {
    label: "Non (- de 5,5 °C)",
    className: "fr-badge fr-badge--green-emeraude fr-icon-checkbox-line fr-badge--icon-left",
  },
  [IlotChaleurUrbain.NON_COUVERT]: {
    label: "Non couvert par la cartographie",
    className: "fr-badge fr-badge--green-emeraude fr-icon-question-line fr-badge--icon-left",
  },
};

const BADGE_INDISPONIBLE = {
  label: "Donnée non accessible",
  className: "fr-badge fr-badge--yellow-tournesol fr-icon-close-circle-line fr-badge--icon-left",
};

const ID = "ilot-chaleur-urbain";

/**
 * Affichage en lecture seule de l'exposition du site à un îlot de chaleur urbain.
 * Donnée informative : elle ne pèse pas sur l'indice de mutabilité (ADR-0034).
 */
export const IlotChaleurField: React.FC<IlotChaleurFieldProps> = ({ value, tooltip }) => {
  const badge = value ? BADGES[value] : BADGE_INDISPONIBLE;

  return (
    <div className="fr-col-12 fr-col-md-6">
      <div className="fr-input-group">
        <label className="fr-label fr-mb-2v" htmlFor={ID}>
          <strong>Site concerné par un îlot de chaleur</strong>
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
