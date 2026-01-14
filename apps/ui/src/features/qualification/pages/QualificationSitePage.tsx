import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../shared/config/routes.config";
import { Stepper } from "../../../shared/components/layout";
import { Layout } from "../../../shared/components/layout/Layout";
import { useFormContext } from "../../../shared/form/useFormContext";
import { StepNavigation } from "../components/StepNavigation";
import { SiteFormValues, DEFAULT_SITE_VALUES, ValidationErrors } from "../config/types";
import { SITE_FIELDS } from "../config/fields/site.fields";
import { validateSiteForm } from "../config/validators";
import { EnrichedInfoField, FormSelectField, PollutionField } from "../components";
import { PresencePollution } from "@mutafriches/shared-types";

export const QualificationSitePage: React.FC = () => {
  const navigate = useNavigate();
  const { state, setManualData, setCurrentStep, canAccessStep } = useFormContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<SiteFormValues>({
    ...DEFAULT_SITE_VALUES,
    typeProprietaire:
      (state.manualData?.typeProprietaire as SiteFormValues["typeProprietaire"]) || "",
    raccordementEau: (state.manualData?.raccordementEau as SiteFormValues["raccordementEau"]) || "",
    etatBatiInfrastructure:
      (state.manualData?.etatBatiInfrastructure as SiteFormValues["etatBatiInfrastructure"]) || "",
    presencePollution:
      (state.manualData?.presencePollution as SiteFormValues["presencePollution"]) || "",
    valeurArchitecturaleHistorique:
      (state.manualData
        ?.valeurArchitecturaleHistorique as SiteFormValues["valeurArchitecturaleHistorique"]) || "",
  });
  const [errors, setErrors] = useState<ValidationErrors<SiteFormValues>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Verifier l'acces a cette etape
  useEffect(() => {
    if (!canAccessStep(1)) {
      navigate(ROUTES.HOME);
      return;
    }
    setCurrentStep(1);
  }, [canAccessStep, navigate, setCurrentStep]);

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
    setIsSubmitting(true);

    // Marquer tous les champs comme touches
    const allTouched: Record<string, boolean> = {};
    Object.keys(SITE_FIELDS).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Valider tous les champs
    const validationErrors = validateSiteForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      const updatedManualData = {
        ...state.manualData,
        ...values,
      };
      setManualData(updatedManualData);
      navigate(ROUTES.QUALIFICATION_ENVIRONNEMENT);
    } else {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    navigate(ROUTES.HOME);
  };

  if (!canAccessStep(1)) {
    return null;
  }

  const uiData = state.uiData;

  return (
    <Layout>
      <Stepper
        currentStep={1}
        totalSteps={3}
        currentStepTitle="Qualifier le site et son bati"
        nextStepTitle="Qualifier l'environnement du site"
      />

      <form id="site-form" onSubmit={handleSubmit}>
        {/* Zone 1 */}
        <div className="fr-grid-row fr-grid-row--gutters">
          <EnrichedInfoField
            id="commune"
            label="Commune"
            value={uiData?.commune || "-"}
            tooltip={
              <>
                Récupéré depuis l'API IGN Cadastre :<br />
                <a
                  href="https://apicarto.ign.fr/api/doc/cadastre"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fr-link fr-text--xs"
                >
                  apicarto.ign.fr/api/doc/cadastre
                </a>
              </>
            }
          />

          <EnrichedInfoField
            id="identifiant-parcelle"
            label="Identifiant parcelle"
            value={uiData?.identifiantParcelle || "-"}
            tooltip={
              <>
                Récupéré depuis l'API IGN Cadastre :<br />
                <a
                  href="https://apicarto.ign.fr/api/doc/cadastre"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fr-link fr-text--xs"
                >
                  apicarto.ign.fr/api/doc/cadastre
                </a>
              </>
            }
          />

          <EnrichedInfoField
            id="surface-site"
            label="Surface du site"
            value={uiData?.surfaceParcelle || "-"}
            tooltip={
              <>
                Récupéré depuis l'API IGN Cadastre :<br />
                <a
                  href="https://apicarto.ign.fr/api/doc/cadastre"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fr-link fr-text--xs"
                >
                  apicarto.ign.fr/api/doc/cadastre
                </a>
              </>
            }
          />

          <EnrichedInfoField
            id="surface-batie"
            label="Surface bâtie"
            value={uiData?.surfaceBatie || "-"}
            tooltip={
              <>
                Récupéré depuis l'API BDNB :<br />
                <a
                  href="https://api-portail.bdnb.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fr-link fr-text--xs"
                >
                  api-portail.bdnb.io
                </a>
              </>
            }
          />

          <FormSelectField
            field={SITE_FIELDS.typeProprietaire}
            value={values.typeProprietaire}
            onChange={(v) => handleChange("typeProprietaire", v)}
            error={touched.typeProprietaire ? errors.typeProprietaire : undefined}
            tooltip="Renseignez à quel type de propriétaire le site appartient. Cette donnée permet d'apprécier la dureté foncière."
          />
        </div>

        <hr className="fr-my-4w" />

        {/* Zone 2 */}
        <div className="fr-grid-row fr-grid-row--gutters">
          <EnrichedInfoField
            id="distance-raccordement"
            label="Distance au raccordement électrique"
            value={uiData?.distanceRaccordement || "-"}
            tooltip={
              <>
                Récupéré depuis l'API Enedis :<br />
                <a
                  href="https://data.enedis.fr/api/explore/v2.1/catalog/datasets"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fr-link fr-text--xs"
                >
                  data.enedis.fr/api/explore/v2.1/catalog/datasets
                </a>
              </>
            }
          />

          <FormSelectField
            field={SITE_FIELDS.raccordementEau}
            value={values.raccordementEau}
            onChange={(v) => handleChange("raccordementEau", v)}
            error={touched.raccordementEau ? errors.raccordementEau : undefined}
            tooltip="Indiquez si le site est desservi par les réseaux d'eau potable et usées."
          />
        </div>

        <hr className="fr-my-4w" />

        {/* Zone 3 */}
        <div className="fr-grid-row fr-grid-row--gutters">
          <FormSelectField
            field={SITE_FIELDS.valeurArchitecturaleHistorique}
            value={values.valeurArchitecturaleHistorique}
            onChange={(v) => handleChange("valeurArchitecturaleHistorique", v)}
            error={
              touched.valeurArchitecturaleHistorique
                ? errors.valeurArchitecturaleHistorique
                : undefined
            }
            tooltip="Donnez nous votre avis sur l'intérêt architectural  et/ou patrimonial du bâti présent sur le site.  Ce critère est subjectif et relatif à votre appréciation."
          />

          <FormSelectField
            field={SITE_FIELDS.etatBatiInfrastructure}
            value={values.etatBatiInfrastructure}
            onChange={(v) => handleChange("etatBatiInfrastructure", v)}
            error={touched.etatBatiInfrastructure ? errors.etatBatiInfrastructure : undefined}
            tooltip="Renseignez l'état des constructions présentes sur le site. Le menu déroulant vous propose une graduation de l'état de dégradation."
          />
        </div>

        <hr className="fr-my-4w" />

        {/* Zone 4 - Pollution */}
        <div className="fr-grid-row fr-grid-row--gutters fr-mb-8w">
          <PollutionField
            value={values.presencePollution}
            onChange={(v) => handleChange("presencePollution", v as PresencePollution | "")}
            siteReferencePollue={uiData?.siteReferencePollue}
            error={touched.presencePollution ? errors.presencePollution : undefined}
            tooltip="Entrez l'information dont vous disposez sur la présence de pollution sur votre site (sol et bâti). Si la case 'Oui' est présélectionnée, c'est que nous avons retrouvé votre site dans une base de données nationales des sites pollués."
          />
        </div>
      </form>

      <StepNavigation
        onPrevious={handlePrevious}
        previousLabel="Precedent"
        nextLabel="Suivant"
        nextType="submit"
        formId="site-form"
        isLoading={isSubmitting}
      />
    </Layout>
  );
};
