import React, { useState, useMemo } from "react";
import { FormSection } from "./FormSection";
import { DEFAULT_FORM_VALUES, ManualFormValues, validateForm, ValidationErrors } from "../config";

interface ManualDataFormProps {
  initialValues?: Partial<ManualFormValues>;
  onSubmit: (values: ManualFormValues) => void;
  isSubmitting?: boolean;
}

/**
 * Formulaire complet pour la saisie des données manuelles
 */
export const ManualDataForm: React.FC<ManualDataFormProps> = ({
  initialValues = {},
  onSubmit,
  isSubmitting = false,
}) => {
  // État du formulaire
  const [values, setValues] = useState<ManualFormValues>({
    ...DEFAULT_FORM_VALUES,
    ...initialValues,
  });

  // État de validation
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  // Calcul des erreurs via useMemo (état dérivé)
  const errors: ValidationErrors = useMemo(() => {
    if (!hasTriedSubmit) {
      return {};
    }
    const { errors: validationErrors } = validateForm(values);
    return validationErrors;
  }, [values, hasTriedSubmit]);

  // Handler pour les changements de valeur
  const handleChange = (fieldName: keyof ManualFormValues, value: string) => {
    setValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Handler pour la soumission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasTriedSubmit(true);

    const validation = validateForm(values);

    if (validation.isValid) {
      onSubmit(values);
    } else {
      // Scroll vers la première erreur
      const firstErrorField = Object.keys(validation.errors)[0];
      if (firstErrorField) {
        const element = document.getElementById(
          firstErrorField.replace(/([A-Z])/g, "-$1").toLowerCase(),
        );
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  return (
    <form id="manual-form" onSubmit={handleSubmit}>
      {/* Section: Informations du site */}
      <FormSection
        section="site"
        title="Informations du site"
        values={values}
        onChange={handleChange}
        errors={errors}
      />

      {/* Section: Environnement du site */}
      <FormSection
        section="environnement"
        title="Environnement du site"
        values={values}
        onChange={handleChange}
        errors={errors}
      />

      {/* Message d'erreur global */}
      {hasTriedSubmit && Object.keys(errors).length > 0 && (
        <div className="fr-alert fr-alert--error fr-mb-4w">
          <h3 className="fr-alert__title">Formulaire incomplet</h3>
          <p>Veuillez remplir tous les champs obligatoires avant de continuer.</p>
        </div>
      )}

      {/* Bouton de soumission (sera géré par le parent) */}
      <input disabled={isSubmitting} type="submit" style={{ display: "none" }} />
    </form>
  );
};
