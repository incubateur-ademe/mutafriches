import React from "react";
import { FormFieldConfig } from "../config";

interface FormFieldProps {
  field: FormFieldConfig<any>;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/**
 * Composant pour afficher un champ de formulaire (select)
 */
export const FormField: React.FC<FormFieldProps> = ({ field, value, onChange, error }) => {
  return (
    <div className="fr-col-12 fr-col-md-6">
      <div className={`fr-select-group ${error ? "fr-select-group--error" : ""}`}>
        <label className="fr-label" htmlFor={field.id}>
          {field.label} {field.required && <span className="fr-text--red">*</span>}
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
