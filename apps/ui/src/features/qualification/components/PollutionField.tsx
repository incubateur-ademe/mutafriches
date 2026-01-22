import React, { useState } from "react";
import { PresencePollution } from "@mutafriches/shared-types";

/** Options pour le select Oui/Non/Ne sait pas */
type PollutionSelectValue = "oui" | "non" | "ne-sait-pas" | "";

/** Types de pollution disponibles quand "Oui" est sélectionné */
const POLLUTION_TYPES = [
  {
    value: PresencePollution.OUI_AMIANTE,
    label: "Présence d'amiante dans le bâti",
    tooltip:
      "L'amiante se retrouve peu dans les sols mais principalement dans le bâti. De nombreux matériaux contenant de l'amiante peuvent subsister dans les cloisons, portes coupe-feu, faux plafonds, tuyaux, dalles de sol, toitures etc.",
  },
  {
    value: PresencePollution.OUI_COMPOSES_VOLATILS,
    label: "Composés volatils",
    tooltip:
      "Les composés organiques volatils sont présents dans l'air et peuvent être nocifs pour l'homme. Ex : benzène, dichlorométhane, formaldéhyde, perchloroéthylène, etc.",
  },
  {
    value: PresencePollution.OUI_AUTRES_COMPOSES,
    label: "Autres composés",
    tooltip:
      "On fait ici référence aux autres composés polluants retrouvés dans les sols du site. Ces polluants peuvent être à l'état solide ou liquide mais ne présentent pas de comportements volatils.",
  },
  {
    value: PresencePollution.DEJA_GEREE,
    label: "Pollution déjà gérée",
    tooltip:
      'Une opération de dépollution a déjà été menée sur le site. Attention toutefois, la méthode "sites et sols pollués" française consiste à dépolluer un site pour un usage donné. Il s\'agira de vérifier que cet usage est identique à celui du projet que vous mènerez sur le site.',
  },
] as const;

interface PollutionFieldProps {
  /** Valeur actuelle (enum PresencePollution) */
  value: PresencePollution | "";
  /** Callback de changement */
  onChange: (value: PresencePollution | "") => void;
  /** Site référencé comme potentiellement pollué (SIS/ICPE/ADEME) */
  siteReferencePollue?: boolean;
  /** Message d'erreur */
  error?: string;
  /** Tooltip pour le select principal */
  tooltip?: React.ReactNode;
}

/**
 * Détermine la valeur du select (oui/non/ne-sait-pas) à partir de la valeur enum
 */
const getSelectValue = (enumValue: PresencePollution | ""): PollutionSelectValue => {
  if (!enumValue) return "";
  if (enumValue === PresencePollution.NON) return "non";
  if (enumValue === PresencePollution.NE_SAIT_PAS) return "ne-sait-pas";
  // Tous les autres cas (OUI_COMPOSES_VOLATILS, OUI_AMIANTE, OUI_AUTRES_COMPOSES, DEJA_GEREE) = "oui"
  return "oui";
};

/**
 * Détermine si la valeur enum correspond à un type de pollution spécifique
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
 * Composant pour la saisie de la présence de pollution
 * - Select Oui/Non/Ne sait pas
 * - Si "Oui" sélectionné, affiche les radios pour le type de pollution
 * - Pré-sélectionne "Oui" si le site est référencé comme pollué
 */
export const PollutionField: React.FC<PollutionFieldProps> = ({
  value,
  onChange,
  siteReferencePollue = false,
  error,
  tooltip,
}) => {
  // État interne pour tracker si l'utilisateur a explicitement cliqué sur "Oui"
  // (sans avoir encore choisi un type de pollution)
  const [userSelectedOui, setUserSelectedOui] = useState<boolean>(false);

  // Déterminer si "Oui" doit être affiché comme sélectionné :
  // - Si la valeur externe est un type de pollution
  // - OU si l'utilisateur a cliqué sur "Oui" (même sans type choisi)
  // - OU si le site est référencé pollué et qu'aucune valeur n'est encore choisie
  const ouiSelected = isPollutionType(value) || userSelectedOui || (siteReferencePollue && !value);

  // Calculer la valeur du select
  const selectValue: PollutionSelectValue = ouiSelected
    ? "oui"
    : value
      ? getSelectValue(value)
      : "";

  const pollutionType = isPollutionType(value) ? value : "";

  const handleSelectChange = (newSelectValue: PollutionSelectValue) => {
    if (newSelectValue === "non") {
      setUserSelectedOui(false);
      onChange(PresencePollution.NON);
    } else if (newSelectValue === "ne-sait-pas") {
      setUserSelectedOui(false);
      onChange(PresencePollution.NE_SAIT_PAS);
    } else if (newSelectValue === "oui") {
      // Marquer "Oui" comme sélectionné mais ne pas changer la valeur
      // tant que l'utilisateur n'a pas choisi un type de pollution
      setUserSelectedOui(true);
    } else {
      setUserSelectedOui(false);
      onChange("");
    }
  };

  const handlePollutionTypeChange = (type: PresencePollution) => {
    onChange(type);
  };

  const showPollutionTypes = ouiSelected;

  return (
    <>
      {/* Select Oui/Non/Ne sait pas */}
      <div className="fr-col-12 fr-col-md-6">
        <div className={`fr-select-group ${error ? "fr-select-group--error" : ""}`}>
          <label className="fr-label" htmlFor="presence-pollution">
            <strong>Présence de pollution *</strong>
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
            <option value="">Sélectionner une option</option>
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

      {/* Radios pour le type de pollution (affiché uniquement si "Oui" sélectionné) */}
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
