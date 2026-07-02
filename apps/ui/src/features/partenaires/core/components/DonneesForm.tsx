import React from "react";
import { FormSelectField } from "@features/qualification/components";
import { SITE_FIELDS } from "@features/qualification/config/fields/site.fields";
import { ENVIRONNEMENT_FIELDS } from "@features/qualification/config/fields/environnement.fields";

interface DonneesFormProps {
  values: Record<string, string>;
  onChange: (fieldName: string, value: string) => void;
}

const ALL_FIELDS = [
  { title: "LE SITE ET SON BÂTI", fields: Object.values(SITE_FIELDS) },
  { title: "L'ENVIRONNEMENT DU SITE", fields: Object.values(ENVIRONNEMENT_FIELDS) },
];

const TOOLTIPS: Record<string, string> = {
  typeProprietaire:
    "Renseignez à quel type de propriétaire le site appartient. Cette donnée permet d'apprécier la dureté foncière.",
  etatBatiInfrastructure:
    "Renseignez l'état des constructions présentes sur le site. Le menu déroulant vous propose une graduation de l'état de dégradation.",
  presencePollution:
    "Entrez l'information dont vous disposez sur la présence de pollution sur votre site (sol et bâti).",
  valeurArchitecturaleHistorique:
    "Donnez-nous votre avis sur l'intérêt architectural et/ou patrimonial du bâti présent sur le site. Ce critère est subjectif et relatif à votre appréciation.",
  qualiteVoieDesserte: "Indiquez la qualité de la desserte du site par les voies de circulation.",
  qualitePaysage: "Donnez-nous votre avis sur l'intérêt paysager de l'environnement du site.",
  trameVerteEtBleue:
    "Indiquez si le site est situé dans un corridor écologique ou un réservoir de biodiversité.",
  presenceEspecesProtegees:
    "Renseignez si votre site est concerné ou non par la présence d'une espèce protégée. Vous obtiendrez cette information en réalisant des études faune/flore sur votre site.",
  presenceZoneHumide:
    "Renseignez si votre site est concerné ou non par la présence d'une zone humide.",
};

export const DonneesForm: React.FC<DonneesFormProps> = ({ values, onChange }) => {
  return (
    <div>
      {ALL_FIELDS.map((section) => (
        <fieldset key={section.title} className="fr-fieldset fr-mb-2w">
          <legend className="fr-fieldset__legend fr-text--lg fr-text--bold">{section.title}</legend>
          <div className="fr-fieldset__element">
            <div className="fr-grid-row fr-grid-row--gutters">
              {section.fields.map((field) => (
                <FormSelectField
                  key={field.name}
                  field={field}
                  value={values[field.name] || ""}
                  onChange={(value) => onChange(field.name, value)}
                  tooltip={TOOLTIPS[field.name]}
                />
              ))}
            </div>
          </div>
        </fieldset>
      ))}
    </div>
  );
};
