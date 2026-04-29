import React from "react";
import type { AlgorithmeVersionDto } from "@mutafriches/shared-types";
import { FormSelectField } from "@features/qualification/components";
import { SITE_FIELDS } from "@features/qualification/config/fields/site.fields";
import { ENVIRONNEMENT_FIELDS } from "@features/qualification/config/fields/environnement.fields";

interface CCI92DonneesFormProps {
  values: Record<string, string>;
  onChange: (fieldName: string, value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  versions: AlgorithmeVersionDto[];
  selectedVersion: string;
  onVersionChange: (version: string) => void;
}

const ALL_FIELDS = [
  { title: "Caractéristiques du site", fields: Object.values(SITE_FIELDS) },
  { title: "Environnement du site", fields: Object.values(ENVIRONNEMENT_FIELDS) },
];

export const CCI92DonneesForm: React.FC<CCI92DonneesFormProps> = ({
  values,
  onChange,
  onSubmit,
  isSubmitting,
  versions,
  selectedVersion,
  onVersionChange,
}) => {
  return (
    <div className="cci92-form">
      <h3 className="fr-h5 fr-mb-1w">Données complémentaires</h3>
      <p className="fr-mb-3w">
        Renseignez les informations que vous connaissez sur le site. Les champs non remplis seront
        considérés comme inconnus.
      </p>

      {versions.length > 0 && (
        <div className="fr-callout fr-callout--green-emeraude fr-mb-3w">
          <h4 className="fr-callout__title fr-h6">Version de l'algorithme</h4>
          <p className="fr-callout__text fr-text--sm fr-mb-1w">
            Sélectionnez la version de l'algorithme à utiliser pour le calcul de mutabilité.
          </p>
          <div className="fr-select-group" style={{ maxWidth: "400px" }}>
            <label className="fr-label fr-sr-only" htmlFor="cci92-version-algo">
              Version de l'algorithme
            </label>
            <select
              className="fr-select"
              id="cci92-version-algo"
              value={selectedVersion}
              onChange={(e) => onVersionChange(e.target.value)}
            >
              {versions.map((v) => (
                <option key={v.version} value={v.version}>
                  {v.version} — {v.label} ({v.date})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {ALL_FIELDS.map((section) => (
        <fieldset key={section.title} className="fr-fieldset fr-mb-2w">
          <legend className="fr-fieldset__legend fr-text--bold">{section.title}</legend>
          <div className="fr-fieldset__element">
            <div className="fr-grid-row fr-grid-row--gutters">
              {section.fields.map((field) => (
                <FormSelectField
                  key={field.name}
                  field={field}
                  value={values[field.name] || ""}
                  onChange={(value) => onChange(field.name, value)}
                />
              ))}
            </div>
          </div>
        </fieldset>
      ))}

      <div className="fr-mt-2w">
        <button
          type="button"
          className="fr-btn"
          onClick={onSubmit}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? "Calcul en cours..." : "Calculer la mutabilité"}
        </button>
      </div>
    </div>
  );
};
