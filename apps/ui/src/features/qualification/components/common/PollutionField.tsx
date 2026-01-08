import React, { useEffect, useState } from "react";
import { PresencePollution } from "@mutafriches/shared-types";

/** Options pour le select Oui/Non/Ne sait pas */
type PollutionSelectValue = "oui" | "non" | "ne-sait-pas" | "";

/** Types de pollution disponibles quand "Oui" est selectionne */
const POLLUTION_TYPES = [
  { value: PresencePollution.OUI_COMPOSES_VOLATILS, label: "Composes volatils" },
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
  const [selectValue, setSelectValue] = useState<PollutionSelectValue>(getSelectValue(value));
  const [pollutionType, setPollutionType] = useState<PresencePollution | "">(
    isPollutionType(value) ? value : "",
  );

  // Pre-selectionner "Oui" si le site est reference comme pollue et aucune valeur n'est deja selectionnee
  useEffect(() => {
    if (siteReferencePollue && !value) {
      setSelectValue("oui");
    }
  }, [siteReferencePollue, value]);

  // Synchroniser les valeurs internes avec la valeur externe
  useEffect(() => {
    setSelectValue(getSelectValue(value));
    setPollutionType(isPollutionType(value) ? value : "");
  }, [value]);

  const handleSelectChange = (newSelectValue: PollutionSelectValue) => {
    setSelectValue(newSelectValue);

    if (newSelectValue === "non") {
      setPollutionType("");
      onChange(PresencePollution.NON);
    } else if (newSelectValue === "ne-sait-pas") {
      setPollutionType("");
      onChange(PresencePollution.NE_SAIT_PAS);
    } else if (newSelectValue === "oui") {
      // Si "Oui" est selectionne, on attend la selection du type de pollution
      // On ne change pas encore la valeur finale
      setPollutionType("");
      onChange("");
    } else {
      setPollutionType("");
      onChange("");
    }
  };

  const handlePollutionTypeChange = (type: PresencePollution) => {
    setPollutionType(type);
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
            {siteReferencePollue && (
              <span className="fr-hint-text">
                Ce site est reference dans les bases de donnees nationales comme potentiellement
                pollue (SIS/ICPE)
              </span>
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
              <div key={type.value} className="fr-fieldset__element">
                <div className="fr-radio-group">
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
                </div>
              </div>
            ))}
          </fieldset>
        </div>
      )}
    </>
  );
};
