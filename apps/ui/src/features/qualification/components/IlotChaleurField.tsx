import React from "react";
import { IlotChaleurUrbain } from "@mutafriches/shared-types";
import { DonneeIndisponibleTag, Tag } from "@shared/components/tag";

interface IlotChaleurFieldProps {
  /** Valeur enrichie depuis la cartographie ICU du CSTB */
  value?: IlotChaleurUrbain;
  /** Contenu du tooltip */
  tooltip?: React.ReactNode;
}

const LABELS: Record<IlotChaleurUrbain.OUI | IlotChaleurUrbain.NON, string> = {
  [IlotChaleurUrbain.OUI]: "Oui (+ de 5,5 °C)",
  [IlotChaleurUrbain.NON]: "Non — aucun îlot de chaleur identifié",
};

const ID = "ilot-chaleur-urbain";

/**
 * Affichage en lecture seule de l'exposition du site à un îlot de chaleur urbain.
 * Donnée informative : elle ne pèse pas sur l'indice de mutabilité (ADR-0034).
 */
export const IlotChaleurField: React.FC<IlotChaleurFieldProps> = ({ value, tooltip }) => {
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
        {value === IlotChaleurUrbain.OUI || value === IlotChaleurUrbain.NON ? (
          <Tag id={ID} variant="bleu">
            {LABELS[value]}
          </Tag>
        ) : (
          <DonneeIndisponibleTag
            id={ID}
            motif={value === IlotChaleurUrbain.NON_COUVERT ? "non-couverte" : "non-accessible"}
          />
        )}
      </div>
    </div>
  );
};
