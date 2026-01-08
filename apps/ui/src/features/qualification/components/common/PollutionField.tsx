import React from "react";
import { PresencePollution } from "@mutafriches/shared-types";

/** Options pour le select Oui/Non/Ne sait pas */
type PollutionSelectValue = "oui" | "non" | "ne-sait-pas" | "";

/** Types de pollution disponibles quand "Oui" est selectionne */
const POLLUTION_TYPES = [
  {
    value: PresencePollution.OUI_COMPOSES_VOLATILS,
    label: "Composes volatils",
    tooltip:
      "Les composes organiques volatils sont presents dans l'air et peuvent etre nocifs pour l'homme. Ex : benzene, dichloromethane, formaldehyde, perchloroethylene, etc.",
  },
  { value: PresencePollution.OUI_AMIANTE, label: "Presence d'amiante" },
  { value: PresencePollution.OUI_AUTRES_COMPOSES, label: "Autres composes" },
  { value: PresencePollution.DEJA_GEREE, label: "Pollution deja geree" },
] as const;

interface PollutionFieldProps {
  /** Valeur actuelle (enum PresencePollution) */
  value: PresencePollution | "";
  /** Callback de changement */
  onChange: (value: PresencePollution | "") => void;
  /** Site reference comme potentiellement pollue (SIS/ICPE/ADEME) */
  siteReferencePollue?: boolean;
  /** Message d'erreur */
  error?: string;
  /** Tooltip pour le select principal */
  tooltip?: React.ReactNode;
}

/**
 * Determine la valeur du select (oui/non/ne-sait-pas) a partir de la valeur enum
 */
const getSelectValue = (enumValue: PresencePollution | ""): PollutionSelectValue => {
  if (!enumValue) return "";
  if (enumValue === PresencePollution.NON) return "non";
  if (enumValue === PresencePollution.NE_SAIT_PAS) return "ne-sait-pas";
  // Tous les autres cas (OUI_COMPOSES_VOLATILS, OUI_AMIANTE, OUI_AUTRES_COMPOSES, DEJA_GEREE) = "oui"
  return "oui";
};

/**
 * Determine si la valeur enum correspond a un type de pollution specifique
 */
const isPollutionType = (value: PresencePollution | ""): boolean => {
  return (
    value === PresencePollution.OUI_COMPOSES_VOLATILS ||
    value === PresencePollution.OUI_AMIANTE ||
    value === PresencePollution.OUI_AUTRES_COMPOSES ||
    value === PresencePollution.DEJA_GEREE
  );
};

/**
 * Composant pour la saisie de la presence de pollution
 * - Select Oui/Non/Ne sait pas
 * - Si "Oui" selectionne, affiche les radios pour le type de pollution
 * - Pre-selectionne "Oui" si le site est reference comme pollue
 */
export const PollutionField: React.FC<PollutionFieldProps> = ({
  value,
  onChange,
  siteReferencePollue = false,
  error,
  tooltip,
}) => {
  // Calculer la valeur du select directement depuis les props (pas de state interne)
  // Si value existe, on l'utilise. Sinon si siteReferencePollue, on affiche "oui"
  const selectValue: PollutionSelectValue = value
    ? getSelectValue(value)
    : siteReferencePollue
      ? "oui"
      : "";

  const pollutionType = isPollutionType(value) ? value : "";

  const handleSelectChange = (newSelectValue: PollutionSelectValue) => {
    if (newSelectValue === "non") {
      onChange(PresencePollution.NON);
    } else if (newSelectValue === "ne-sait-pas") {
      onChange(PresencePollution.NE_SAIT_PAS);
    } else if (newSelectValue === "oui") {
      // Si "Oui" est selectionne, on attend la selection du type de pollution
      // On ne change pas encore la valeur finale
      onChange("");
    } else {
      onChange("");
    }
  };

  const handlePollutionTypeChange = (type: PresencePollution) => {
    onChange(type);
  };

  const showPollutionTypes = selectValue === "oui";

  return (
    <>
      {/* Select Oui/Non/Ne sait pas */}
      <div className="fr-col-12 fr-col-md-6">
        <div className={`fr-select-group ${error ? "fr-select-group--error" : ""}`}>
          <label className="fr-label" htmlFor="presence-pollution">
            <strong>Presence de pollution *</strong>
            {tooltip && (
              <>
                <button
                  aria-describedby="presence-pollution-tooltip"
                  type="button"
                  className="fr-btn--tooltip fr-btn"
                >
                  infobulle
                </button>
                <span
                  className="fr-tooltip fr-placement"
                  id="presence-pollution-tooltip"
                  role="tooltip"
                >
                  {tooltip}
                </span>
              </>
            )}
          </label>
          <select
            className={`fr-select ${error ? "fr-select--error" : ""}`}
            id="presence-pollution"
            name="presencePollution"
            value={selectValue}
            onChange={(e) => handleSelectChange(e.target.value as PollutionSelectValue)}
            aria-describedby={error ? "presence-pollution-error" : undefined}
          >
            <option value="">Selectionner une option</option>
            <option value="oui">Oui</option>
            <option value="non">Non</option>
            <option value="ne-sait-pas">Ne sait pas</option>
          </select>
          {error && (
            <p className="fr-error-text" id="presence-pollution-error">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Radios pour le type de pollution (affiche uniquement si "Oui" selectionne) */}
      {showPollutionTypes && (
        <div className="fr-col-12 fr-col-md-6">
          <fieldset
            className={`fr-fieldset ${error && !pollutionType ? "fr-fieldset--error" : ""}`}
            id="pollution-type-fieldset"
            aria-labelledby="pollution-type-legend"
          >
            <legend className="fr-fieldset__legend" id="pollution-type-legend">
              <strong>Type de pollution *</strong>
            </legend>
            {POLLUTION_TYPES.map((type) => (
              <div
                key={type.value}
                className="fr-fieldset__element"
                style={{ position: "relative" }}
              >
                <div
                  className="fr-radio-group"
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  <input
                    type="radio"
                    id={`pollution-type-${type.value}`}
                    name="pollutionType"
                    value={type.value}
                    checked={pollutionType === type.value}
                    onChange={() => handlePollutionTypeChange(type.value)}
                  />
                  <label className="fr-label" htmlFor={`pollution-type-${type.value}`}>
                    {type.label}
                  </label>
                  {"tooltip" in type && type.tooltip && (
                    <button
                      aria-describedby={`pollution-type-tooltip-${type.value}`}
                      type="button"
                      className="fr-btn--tooltip fr-btn"
                      style={{ flexShrink: 0 }}
                    >
                      infobulle
                    </button>
                  )}
                </div>
                {"tooltip" in type && type.tooltip && (
                  <span
                    className="fr-tooltip fr-placement"
                    id={`pollution-type-tooltip-${type.value}`}
                    role="tooltip"
                  >
                    {type.tooltip}
                  </span>
                )}
              </div>
            ))}
          </fieldset>
        </div>
      )}
    </>
  );
};
