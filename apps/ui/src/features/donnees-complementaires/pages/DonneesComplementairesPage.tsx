import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFormContext } from "../context/useFormContext";
import { ROUTES } from "../../../shared/config/routes.config";
import { ManualFormValues } from "../config";
import { Stepper } from "../../../shared/components/layout";
import { Layout } from "../../../shared/components/layout/Layout";
import { ManualDataForm } from "../components/ManualDataForm";

export const Step2: React.FC = () => {
  const navigate = useNavigate();
  const { state, setManualData, setCurrentStep, canAccessStep } = useFormContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vérifier l'accès à cette étape
  useEffect(() => {
    if (!canAccessStep(2)) {
      navigate(ROUTES.STEP1);
      return;
    }
    setCurrentStep(2);
  }, [canAccessStep, navigate, setCurrentStep]);

  // Handler pour le retour
  const handlePrevious = () => {
    navigate(ROUTES.STEP1);
  };

  // Handler pour la soumission du formulaire
  const handleSubmit = async (values: ManualFormValues) => {
    setIsSubmitting(true);

    try {
      // Convertir les valeurs pour enlever les chaînes vides
      const dataToSave: Record<string, string> = {};
      Object.entries(values).forEach(([key, value]) => {
        if (value) {
          dataToSave[key] = value;
        }
      });

      // Sauvegarder dans le contexte
      setManualData(dataToSave);

      // Navigation vers l'étape 3
      navigate(ROUTES.STEP3);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setIsSubmitting(false);
    }
  };

  // Si pas d'accès, ne rien afficher (la redirection se fait dans useEffect)
  if (!canAccessStep(2)) {
    return null;
  }

  return (
    <Layout showSimpleHeader={true}>
      <Stepper
        currentStep={2}
        totalSteps={3}
        currentStepTitle="Données complémentaires"
        nextStepTitle="Usages les plus appropriés"
      />

      <div className="fr-mb-4w">
        <h3>Renseignez des données complémentaires</h3>
        <p className="fr-text--sm">
          Complétez les champs suivants pour améliorer la fiabilité des résultats qui vont suivre
        </p>

        {/* Formulaire */}
        <ManualDataForm
          initialValues={state.manualData}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />

        {/* Boutons de navigation */}
        <div className="fr-mt-4w" style={{ textAlign: "center" }}>
          <button
            type="button"
            className="fr-btn fr-btn--secondary"
            onClick={handlePrevious}
            disabled={isSubmitting}
          >
            <span className="fr-icon-arrow-left-s-line fr-icon--sm" aria-hidden="true"></span>
            Précédent
          </button>

          <button
            type="submit"
            form="manual-form"
            className="fr-btn fr-ml-2w"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="fr-icon-refresh-line fr-icon--sm" aria-hidden="true"></span>
                Calcul en cours...
              </>
            ) : (
              <>
                Calculer les résultats
                <span className="fr-icon-arrow-right-s-line fr-icon--sm" aria-hidden="true"></span>
              </>
            )}
          </button>
        </div>
      </div>
    </Layout>
  );
};
