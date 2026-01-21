import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../shared/config/routes.config";
import { Stepper } from "../../../shared/components/layout";
import { Layout } from "../../../shared/components/layout/Layout";
import { useFormContext } from "../../../shared/form/useFormContext";
import { useEventTracking } from "../../../shared/hooks/useEventTracking";
import { TypeEvenement } from "@mutafriches/shared-types";
import { StepNavigation } from "../components/StepNavigation";
import { EnrichedInfoField, FormSelectField } from "../components";
import {
  EnvironnementFormValues,
  DEFAULT_ENVIRONNEMENT_VALUES,
  ValidationErrors,
} from "../config/types";
import { ENVIRONNEMENT_FIELDS } from "../config/fields/environnement.fields";
import { validateEnvironnementForm } from "../config/validators";

export const QualificationEnvironnementPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, setManualData, setCurrentStep, canAccessStep } = useFormContext();
  const { track } = useEventTracking();
  const hasTrackedVisit = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<EnvironnementFormValues>({
    ...DEFAULT_ENVIRONNEMENT_VALUES,
    qualitePaysage:
      (state.manualData?.qualitePaysage as EnvironnementFormValues["qualitePaysage"]) || "",
    qualiteVoieDesserte:
      (state.manualData?.qualiteVoieDesserte as EnvironnementFormValues["qualiteVoieDesserte"]) ||
      "",
    trameVerteEtBleue:
      (state.manualData?.trameVerteEtBleue as EnvironnementFormValues["trameVerteEtBleue"]) || "",
  });
  const [errors, setErrors] = useState<ValidationErrors<EnvironnementFormValues>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Vérifier l'accès à cette étape
  useEffect(() => {
    if (!canAccessStep(2)) {
      navigate(ROUTES.QUALIFICATION_SITE);
      return;
    }
    setCurrentStep(2);

    // Tracker l'arrivée sur la page
    if (!hasTrackedVisit.current) {
      hasTrackedVisit.current = true;
      track(TypeEvenement.QUALIFICATION_ENVIRONNEMENT, {
        identifiantCadastral: state.identifiantParcelle || undefined,
      });
    }
  }, [canAccessStep, navigate, setCurrentStep, track, state.identifiantParcelle]);

  const handleChange = (fieldName: keyof EnvironnementFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
    setTouched((prev) => ({ ...prev, [fieldName]: true }));

    // Valider le champ modifié
    if (touched[fieldName]) {
      const newErrors = validateEnvironnementForm({ ...values, [fieldName]: value });
      setErrors((prev) => ({
        ...prev,
        [fieldName]: newErrors[fieldName],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Marquer tous les champs comme touchés
    const allTouched: Record<string, boolean> = {};
    Object.keys(ENVIRONNEMENT_FIELDS).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Valider tous les champs
    const validationErrors = validateEnvironnementForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      try {
        // Fusionner avec les données manuelles existantes
        const updatedManualData = {
          ...state.manualData,
          ...values,
        };

        // Sauvegarder les données dans le contexte
        setManualData(updatedManualData);

        // Tracker l'événement de saisie des données complémentaires
        const dataRecord = updatedManualData as Record<string, string>;
        await track(TypeEvenement.DONNEES_COMPLEMENTAIRES_SAISIES, {
          identifiantCadastral: state.identifiantParcelle || undefined,
          donnees: {
            nombreChampsSaisis: Object.keys(dataRecord).filter(
              (k) => dataRecord[k] && dataRecord[k] !== "",
            ).length,
          },
        });

        // Passer à l'étape suivante
        navigate(ROUTES.QUALIFICATION_RISQUES);
      } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error);
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    navigate(ROUTES.QUALIFICATION_SITE);
  };

  // Si pas d'accès, ne rien afficher (la redirection se fait dans useEffect)
  if (!canAccessStep(2)) {
    return null;
  }

  const uiData = state.uiData;

  return (
    <Layout>
      <Stepper
        currentStep={2}
        totalSteps={3}
        currentStepTitle="Qualifier l'environnement du site"
        nextStepTitle="Qualifier les risques et zonages du site"
      />

      <form id="environnement-form" onSubmit={handleSubmit}>
        {/* Zone 1 - Données enrichies */}
        <div className="fr-grid-row fr-grid-row--gutters">
          <EnrichedInfoField
            id="site-centre-ville"
            label="Site en centre ville"
            value={uiData?.centreVille}
            tooltip={
              <>
                Récupéré depuis l'API de l'annuaire du Service public :<br />
                <a
                  href="https://api-lannuaire.service-public.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fr-link fr-text--xs"
                >
                  api-lannuaire.service-public.fr
                </a>
              </>
            }
          />

          <EnrichedInfoField
            id="proximite-commerces-services"
            label="Proximité des commerces et services"
            value={uiData?.proximiteCommerces}
            tooltip={
              <>
                Récupéré depuis la base permanente des équipements (BPE) :<br />
                <a
                  href="https://www.insee.fr/fr/metadonnees/source/serie/s1161"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fr-link fr-text--xs"
                >
                  insee.fr/fr/metadonnees/source/serie/s1161
                </a>
              </>
            }
          />
        </div>

        {/* Zone 2 - Taux LV */}
        <div className="fr-grid-row fr-grid-row--gutters">
          <EnrichedInfoField
            id="taux-logements-vacants"
            label="Taux de logements vacants"
            value={uiData?.tauxLV}
            tooltip={
              <>
                Récupéré depuis l'API tabulaire de data.gouv.fr :<br />
                <a
                  href="https://www.data.gouv.fr/datasets/logements-vacants-du-parc-prive-en-france-et-par-commune-departement-region"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fr-link fr-text--xs"
                >
                  data.gouv.fr/datasets/logements-vacants
                </a>
              </>
            }
          />
        </div>

        <hr className="fr-my-4w" />

        {/* Zone 3 - Distance transport et voie grande circulation */}
        <div className="fr-grid-row fr-grid-row--gutters">
          <EnrichedInfoField
            id="distance-transport-commun"
            label="Distance aux transports en commun"
            value={uiData?.distanceTransportsEnCommun}
            tooltip={
              <>
                Récupéré depuis le jeu de données de Transport.data.gouv.fr :<br />
                <a
                  href="https://transport.data.gouv.fr/datasets/arrets-de-transport-en-france"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fr-link fr-text--xs"
                >
                  transport.data.gouv.fr/datasets/arrets-de-transport-en-france
                </a>
              </>
            }
          />

          <EnrichedInfoField
            id="distance-voie-grande-circulation"
            label="Distance à une voie à grande circulation"
            value={uiData?.distanceAutoroute}
            tooltip={
              <>
                Récupéré depuis l'API IGN Géoplateforme WFS :<br />
                <a
                  href="https://geoservices.ign.fr/services-web-essentiels"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fr-link fr-text--xs"
                >
                  geoservices.ign.fr/services-web-essentiels
                </a>
              </>
            }
          />

          <FormSelectField
            field={ENVIRONNEMENT_FIELDS.qualiteVoieDesserte}
            value={values.qualiteVoieDesserte}
            onChange={(v) => handleChange("qualiteVoieDesserte", v)}
            error={touched.qualiteVoieDesserte ? errors.qualiteVoieDesserte : undefined}
            tooltip="Indiquez la qualité de la desserte du site par les voies de circulation."
          />
        </div>

        <hr className="fr-my-4w" />

        {/* Zone 4 - Paysage et trame verte */}
        <div className="fr-grid-row fr-grid-row--gutters fr-mb-8w">
          <FormSelectField
            field={ENVIRONNEMENT_FIELDS.qualitePaysage}
            value={values.qualitePaysage}
            onChange={(v) => handleChange("qualitePaysage", v)}
            error={touched.qualitePaysage ? errors.qualitePaysage : undefined}
            tooltip="Donnez nous votre avis sur l'intérêt paysager de l'environnement du site."
          />

          <FormSelectField
            field={ENVIRONNEMENT_FIELDS.trameVerteEtBleue}
            value={values.trameVerteEtBleue}
            onChange={(v) => handleChange("trameVerteEtBleue", v)}
            error={touched.trameVerteEtBleue ? errors.trameVerteEtBleue : undefined}
            tooltip="Indiquez si le site est situé dans un corridor écologique ou un réservoir de biodiversité."
          />
        </div>
      </form>

      <StepNavigation
        onPrevious={handlePrevious}
        previousLabel="Précédent"
        nextLabel="Suivant"
        nextType="submit"
        formId="environnement-form"
        isLoading={isSubmitting}
      />
    </Layout>
  );
};
