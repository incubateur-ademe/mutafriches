import React from "react";
import { DonneeIndisponibleTag, LABEL_DONNEE_NON_ACCESSIBLE, Tag } from "@shared/components/tag";

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
  /** Rend les badges en alerte plutôt qu'en succès (donnée bloquante pour certains usages) */
  enAlerte?: boolean;
  /** Message explicatif affiché sous les badges */
  message?: string;
}

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
  enAlerte = false,
  message,
}) => {
  const values = Array.isArray(value) ? value : [value];
  const isNonAccessible =
    !value ||
    (typeof value === "string" && (value === LABEL_DONNEE_NON_ACCESSIBLE || value === "-")) ||
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
          <DonneeIndisponibleTag />
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {values.map((v, index) => (
              <Tag key={index} variant={enAlerte ? "saumon-pale" : "bleu"}>
                {v}
              </Tag>
            ))}
          </div>
        )}
        {message && <p className="fr-hint-text fr-mt-1v">{message}</p>}
      </div>
    </div>
  );
};
