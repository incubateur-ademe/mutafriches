import {
  CRITERES_METADATA,
  getSourceCritere,
  MATRICE_SCORING_DOC,
  type CritereMatriceDoc,
  type SourceCritereDoc,
} from "@mutafriches/shared-types";
import { formatEvolution } from "../utils/format";

const MODES_APPEL: Record<SourceCritereDoc["type"], string> = {
  "api-externe": "API externe",
  "referentiel-local": "Import en base",
};

// Seul critère non saisi qui n'a pas de source externe : il est déduit d'un autre critère (ADR-0019)
const CRITERE_DERIVE = "raccordementEau";

function SourceRow({ critere }: { critere: CritereMatriceDoc }) {
  const source = getSourceCritere(CRITERES_METADATA[critere.cle]);
  const derive = critere.cle === CRITERE_DERIVE;
  return (
    <tr>
      <th scope="row" className="fr-cell--multiline">
        {critere.nom}
      </th>
      <td className="fr-cell--multiline">
        {source ? (
          <>
            {source.nom} /<br />
            {source.producteur}
          </>
        ) : derive ? (
          "Déduit de l'emprise au sol du bâti"
        ) : (
          "Saisie de l'utilisateur"
        )}
      </td>
      <td className="fr-cell--multiline">
        {source ? (
          <>
            Automatique
            <br />
            {MODES_APPEL[source.type]}
          </>
        ) : derive ? (
          "Automatique"
        ) : (
          "Manuel"
        )}
      </td>
      <td>
        {source ? (
          <a
            href={source.urlDoc}
            target="_blank"
            rel="noopener noreferrer"
            title={`Documentation de la source ${source.nom} - nouvelle fenêtre`}
          >
            Lien
          </a>
        ) : (
          "—"
        )}
      </td>
      <td>{source?.format ?? "—"}</td>
      <td>
        <code className="fr-text--xs break-all">{critere.cle}</code>
      </td>
      <td className="fr-cell--multiline">{formatEvolution(critere)}</td>
    </tr>
  );
}

export function SourcesCriteresTable() {
  return (
    <div className="fr-table fr-table--sm fr-mb-0">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table>
              <caption className="fr-sr-only">Source des données de chaque critère</caption>
              <thead>
                <tr>
                  <th scope="col">Critère</th>
                  <th scope="col" className="fr-cell--multiline">
                    Source / Producteur
                  </th>
                  <th scope="col">Mode d'appel</th>
                  <th scope="col" className="fr-cell--multiline">
                    Doc de la source
                  </th>
                  <th scope="col" className="fr-cell--multiline">
                    Format de la source
                  </th>
                  <th scope="col">Clé</th>
                  <th scope="col">Version</th>
                </tr>
              </thead>
              <tbody>
                {MATRICE_SCORING_DOC.map((critere) => (
                  <SourceRow key={critere.cle} critere={critere} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
