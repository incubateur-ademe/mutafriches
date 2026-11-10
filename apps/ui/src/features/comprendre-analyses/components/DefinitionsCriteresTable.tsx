import {
  DEFINITIONS_CRITERES,
  getImpactCritere,
  MATRICE_SCORING_DOC,
  USAGE_LABELS,
  UsageType,
} from "@mutafriches/shared-types";
import { IMPACT_TAG_VARIANT, Tag } from "@shared/components/tag";
import { getUsageInfo } from "../../resultats/utils/usagesLabels.utils";
import { formatPoids, formatScore } from "../utils/format";

// Ordre des colonnes de la maquette
const USAGES: UsageType[] = [
  UsageType.RENATURATION,
  UsageType.PHOTOVOLTAIQUE,
  UsageType.INDUSTRIE,
  UsageType.TERTIAIRE,
  UsageType.RESIDENTIEL,
  UsageType.CULTURE,
  UsageType.EQUIPEMENTS,
];

function ScoreCell({ score }: { score: number | undefined }) {
  if (score === undefined) return <td className="text-center">—</td>;
  const impact = getImpactCritere(score);
  return (
    <td className="text-center">
      <Tag variant={IMPACT_TAG_VARIANT[impact.niveau]} className="fr-mb-0">
        <span aria-hidden="true">{formatScore(score)}</span>
        <span className="fr-sr-only">{impact.label}</span>
      </Tag>
    </td>
  );
}

export function DefinitionsCriteresTable() {
  return (
    <div className="fr-table fr-table--sm fr-table--bordered fr-mb-0">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table>
              <caption className="fr-sr-only">
                Définition, coefficient et scores par usage de chaque critère
              </caption>
              <thead>
                <tr>
                  <th scope="col">Critère</th>
                  <th scope="col">Définition</th>
                  <th scope="col">Coef.</th>
                  <th scope="col">Valeur</th>
                  {USAGES.map((usage) => (
                    <th key={usage} scope="col" className="fr-cell--multiline text-center">
                      <img
                        src={getUsageInfo(usage).image}
                        alt=""
                        className="mx-auto h-[2rem] w-[2rem] object-contain"
                      />
                      <span className="fr-text--xs fr-mb-0 block">{USAGE_LABELS[usage]}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRICE_SCORING_DOC.map((critere) =>
                  critere.lignes.map((ligne, index) => (
                    <tr key={`${critere.cle}-${ligne.reponse}`}>
                      {index === 0 && (
                        <>
                          <th
                            scope="rowgroup"
                            rowSpan={critere.lignes.length}
                            className="fr-cell--multiline"
                          >
                            {critere.nom}
                          </th>
                          <td
                            rowSpan={critere.lignes.length}
                            className="fr-cell--multiline fr-text--xs min-w-[10rem]"
                          >
                            {DEFINITIONS_CRITERES[critere.cle]}
                          </td>
                          <td rowSpan={critere.lignes.length} className="text-center font-bold">
                            {formatPoids(critere.poids)}
                          </td>
                        </>
                      )}
                      <td className="fr-cell--multiline">{ligne.reponse}</td>
                      {USAGES.map((usage) => (
                        <ScoreCell key={usage} score={ligne.scores[usage]} />
                      ))}
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
