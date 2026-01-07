import React, { useState } from "react";
import { FormSelectField } from "../common/FormSelectField";
import { ENVIRONNEMENT_FIELDS_LIST } from "../../config/fields/environnement.fields";
import {
  EnvironnementFormValues,
  DEFAULT_ENVIRONNEMENT_VALUES,
  ValidationErrors,
} from "../../config/types";
import { validateEnvironnementForm } from "../../config/validators";

interface EnvironnementManualFormProps {
  /** Valeurs initiales du formulaire */
  initialValues?: Partial<EnvironnementFormValues>;
  /** Callback de soumission */
  onSubmit: (values: EnvironnementFormValues) => void;
  /** ID du formulaire */
  formId?: string;
}

/**
 * Formulaire de saisie manuelle pour l'etape Environnement
 */
export const EnvironnementManualForm: React.FC<EnvironnementManualFormProps> = ({
  initialValues,
  onSubmit,
  formId = "environnement-form",
}) => {
  const [values, setValues] = useState<EnvironnementFormValues>({
    ...DEFAULT_ENVIRONNEMENT_VALUES,
    ...initialValues,
  });
  const [errors, setErrors] = useState<ValidationErrors<EnvironnementFormValues>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (fieldName: keyof EnvironnementFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
    setTouched((prev) => ({ ...prev, [fieldName]: true }));

    // Valider le champ modifie
    if (touched[fieldName]) {
      const newErrors = validateEnvironnementForm({ ...values, [fieldName]: value });
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
    ENVIRONNEMENT_FIELDS_LIST.forEach((field) => {
      allTouched[field.name] = true;
    });
    setTouched(allTouched);

    // Valider tous les champs
    const validationErrors = validateEnvironnementForm(values);
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
          {ENVIRONNEMENT_FIELDS_LIST.map((field) => (
            <FormSelectField
              key={field.id}
              field={field}
              value={values[field.name as keyof EnvironnementFormValues] || ""}
              onChange={(value) =>
                handleChange(field.name as keyof EnvironnementFormValues, value)
              }
              error={
                touched[field.name]
                  ? errors[field.name as keyof EnvironnementFormValues]
                  : undefined
              }
            />
          ))}
        </div>
      </form>
    </div>
  );
};
