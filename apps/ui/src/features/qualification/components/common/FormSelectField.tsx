import React from "react";

export interface SelectOption<T = string> {
  value: T | "";
  label: string;
}

export interface FormFieldConfig<T = string> {
  id: string;
  name: string;
  label: string;
  required: boolean;
  section: "site" | "environnement" | "risques";
  options: SelectOption<T>[];
  hint?: string;
}

interface FormSelectFieldProps {
  /** Configuration du champ */
  field: FormFieldConfig<string>;
  /** Valeur actuelle */
  value: string;
  /** Callback de changement */
  onChange: (value: string) => void;
  /** Message d'erreur */
  error?: string;
}

/**
 * Composant pour afficher un champ select de formulaire
 */
export const FormSelectField: React.FC<FormSelectFieldProps> = ({
  field,
  value,
  onChange,
  error,
}) => {
  return (
    <div className="fr-col-12 fr-col-md-6">
      <div className={`fr-select-group ${error ? "fr-select-group--error" : ""}`}>
        <label className="fr-label" htmlFor={field.id}>
          {field.label}
          {field.required && <span className="fr-hint-text"> (obligatoire)</span>}
          {field.hint && <span className="fr-hint-text">{field.hint}</span>}
        </label>
        <select
          className={`fr-select ${error ? "fr-select--error" : ""}`}
          id={field.id}
          name={field.name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={error ? `${field.id}-error` : undefined}
        >
          {field.options.map((option) => (
            <option key={option.value || "empty"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="fr-error-text" id={`${field.id}-error`}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
