import React, { useState } from "react";
import { FormSelectField } from "../common/FormSelectField";
import { SITE_FIELDS_LIST } from "../../config/fields/site.fields";
import { SiteFormValues, DEFAULT_SITE_VALUES, ValidationErrors } from "../../config/types";
import { validateSiteForm } from "../../config/validators";

interface SiteManualFormProps {
  /** Valeurs initiales du formulaire */
  initialValues?: Partial<SiteFormValues>;
  /** Callback de soumission */
  onSubmit: (values: SiteFormValues) => void;
  /** ID du formulaire */
  formId?: string;
}

/**
 * Formulaire de saisie manuelle pour l'etape Site
 */
export const SiteManualForm: React.FC<SiteManualFormProps> = ({
  initialValues,
  onSubmit,
  formId = "site-form",
}) => {
  const [values, setValues] = useState<SiteFormValues>({
    ...DEFAULT_SITE_VALUES,
    ...initialValues,
  });
  const [errors, setErrors] = useState<ValidationErrors<SiteFormValues>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (fieldName: keyof SiteFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
    setTouched((prev) => ({ ...prev, [fieldName]: true }));

    // Valider le champ modifie
    if (touched[fieldName]) {
      const newErrors = validateSiteForm({ ...values, [fieldName]: value });
      setErrors((prev) => ({
        ...prev,
        [fieldName]: newErrors[fieldName],
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Marquer tous les champs comme touches
    const allTouched: Record<string, boolean> = {};
    SITE_FIELDS_LIST.forEach((field) => {
      allTouched[field.name] = true;
    });
    setTouched(allTouched);

    // Valider tous les champs
    const validationErrors = validateSiteForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onSubmit(values);
    }
  };

  return (
    <div className="fr-mb-4w">
      <h2 className="fr-h4">Informations a completer</h2>
      <p className="fr-text--sm fr-mb-2w">
        Ces informations ne peuvent pas etre recuperees automatiquement. Veuillez les renseigner
        pour ameliorer la precision de l'analyse.
      </p>

      <form id={formId} onSubmit={handleSubmit}>
        <div className="fr-grid-row fr-grid-row--gutters">
          {SITE_FIELDS_LIST.map((field) => (
            <FormSelectField
              key={field.id}
              field={field}
              value={values[field.name as keyof SiteFormValues] || ""}
              onChange={(value) => handleChange(field.name as keyof SiteFormValues, value)}
              error={touched[field.name] ? errors[field.name as keyof SiteFormValues] : undefined}
            />
          ))}
        </div>
      </form>
    </div>
  );
};
