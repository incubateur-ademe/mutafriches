import React from "react";
import { FormField } from "./FormField";
import { getFieldsBySection, ManualFormValues, ValidationErrors } from "../config";

interface FormSectionProps {
  section: "site" | "environnement";
  title: string;
  values: ManualFormValues;
  onChange: (fieldName: keyof ManualFormValues, value: string) => void;
  errors: ValidationErrors;
}

/**
 * Composant pour afficher une section du formulaire avec ses champs
 */
export const FormSection: React.FC<FormSectionProps> = ({
  section,
  title,
  values,
  onChange,
  errors,
}) => {
  const fields = getFieldsBySection(section);

  return (
    <>
      <h5>{title}</h5>
      <div className="fr-grid-row fr-grid-row--gutters fr-mb-4w">
        {fields.map((field) => (
          <FormField
            key={field.id}
            field={field}
            value={values[field.name as keyof ManualFormValues] || ""}
            onChange={(value) => onChange(field.name as keyof ManualFormValues, value)}
            error={errors[field.name as keyof ManualFormValues]}
          />
        ))}
      </div>
      {section === "site" && <hr />}
    </>
  );
};
