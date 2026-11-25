import {
  CRITERES_METADATA,
  getSourceCritere,
  getSourcesPreRemplissage,
  SOURCES_HORS_CALCUL,
  type CritereMatriceDoc,
  type SourceCritereDoc,
} from "@mutafriches/shared-types";
import { CRITERES_PAR_COEFFICIENT, libelleCritere } from "../utils/criteres";
import { CLASSES_CONTENEUR_TABLEAU, CLASSES_ENTETE_TABLEAU } from "../utils/tableau";
import { formatEvolution } from "../utils/format";

const MODES_APPEL: Record<SourceCritereDoc["type"], string> = {
  "api-externe": "API externe",
  "referentiel-local": "Import en base",
};

// Seul critère non saisi qui n'a pas de source externe : il est déduit d'un autre critère (ADR-0019)
const CRITERE_DERIVE = "raccordementEau";

interface SourcesCriteresTableProps {
  onClicLienSource?: (critere: string, source: string) => void;
}

function SourceRow({
  critere,
  onClicLienSource,
}: { critere: CritereMatriceDoc } & SourcesCriteresTableProps) {
  const sourceAutomatique = getSourceCritere(CRITERES_METADATA[critere.cle]);
  const derive = critere.cle === CRITERE_DERIVE;
  // Une ligne par source : un critère saisi peut être pré-rempli par plusieurs référentiels
  const sources: (SourceCritereDoc | undefined)[] = sourceAutomatique
    ? [sourceAutomatique]
    : getSourcesPreRemplissage(critere.cle);
  if (sources.length === 0) sources.push(undefined);
  const modeSaisie = sourceAutomatique ? "Automatique" : "Manuel, pré-rempli";

  return (
    <>
      {sources.map((source, index) => (
        <tr key={source?.nom ?? critere.cle}>
          {index === 0 && (
            <th
              scope={sources.length > 1 ? "rowgroup" : "row"}
              rowSpan={sources.length}
              className="fr-cell--multiline fr-cell--center"
            >
              {libelleCritere(critere)}
            </th>
          )}
          <td className="fr-cell--multiline fr-cell--center">
            {source ? (
              <>
                {source.nom} /<br />
                {source.producteur}
              </>
            ) : derive ? (
              "Déduit de la surface bâtie"
            ) : (
              "Saisie de l'utilisateur"
            )}
          </td>
          <td className="fr-cell--multiline fr-cell--center">
            {source ? (
              <>
                {modeSaisie}
                <br />
                {MODES_APPEL[source.type]}
              </>
            ) : derive ? (
              "Automatique"
            ) : (
              "Manuel"
            )}
          </td>
          <td className="fr-cell--center">
            {source ? (
              <a
                href={source.urlDoc}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onClicLienSource?.(critere.cle, source.nom)}
                title={`Documentation de la source ${source.nom} - nouvelle fenêtre`}
              >
                Lien
              </a>
            ) : (
              "—"
            )}
          </td>
          <td className="fr-cell--center">{source?.format ?? "—"}</td>
          {index === 0 && (
            <>
              <td rowSpan={sources.length} className="fr-cell--center">
                <code className="fr-text--xs break-all">{critere.cle}</code>
              </td>
              <td rowSpan={sources.length} className="fr-cell--multiline fr-cell--center">
                {formatEvolution(critere)}
              </td>
            </>
          )}
        </tr>
      ))}
    </>
  );
}

function SourcesHorsCalcul({ onClicLienSource }: SourcesCriteresTableProps) {
  return (
    <div className="fr-mt-6w">
      <h2 className="fr-h6">Données complémentaires, hors calcul</h2>
      <p>
        Ces données sont restituées dans chaque analyse à titre d'information. Elles n'entrent ni
        dans les indices de mutabilité ni dans l'indice de fiabilité.
      </p>
      <div className="fr-table fr-table--sm fr-table--bordered fr-mb-0">
        <div className="fr-table__wrapper">
          <div className="fr-table__container">
            <div className="fr-table__content">
              <table>
                <caption className="fr-sr-only">
                  Sources des données restituées sans entrer dans le calcul
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="fr-cell--center">
                      Donnée
                    </th>
                    <th scope="col" className="fr-cell--multiline fr-cell--center">
                      Ce qu'elle indique
                    </th>
                    <th scope="col" className="fr-cell--center">
                      Producteur
                    </th>
                    <th scope="col" className="fr-cell--center">
                      Mode d'appel
                    </th>
                    <th scope="col" className="fr-cell--multiline fr-cell--center">
                      Doc de la source
                    </th>
                    <th scope="col" className="fr-cell--multiline fr-cell--center">
                      Format de la source
                    </th>
                    <th scope="col" className="fr-cell--center">
                      Clé
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SOURCES_HORS_CALCUL.map((source) => (
                    <tr key={source.cle}>
                      <th scope="row" className="fr-cell--multiline fr-cell--center">
                        {source.nom}
                      </th>
                      <td className="fr-cell--multiline fr-cell--center">{source.usage}</td>
                      <td className="fr-cell--center">{source.producteur}</td>
                      <td className="fr-cell--multiline fr-cell--center">
                        Automatique
                        <br />
                        {MODES_APPEL[source.type]}
                      </td>
                      <td className="fr-cell--center">
                        <a
                          href={source.urlDoc}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => onClicLienSource?.(source.cle, source.nom)}
                          title={`Documentation de la source ${source.nom} - nouvelle fenêtre`}
                        >
                          Lien
                        </a>
                      </td>
                      <td className="fr-cell--center">{source.format}</td>
                      <td className="fr-cell--center">
                        <code className="fr-text--xs break-all">{source.cle}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SourcesCriteresTable({ onClicLienSource }: SourcesCriteresTableProps) {
  return (
    <>
      <div className="fr-table fr-table--sm fr-table--bordered fr-mb-0">
        <div className="fr-table__wrapper">
          <div className={CLASSES_CONTENEUR_TABLEAU}>
            <div className="fr-table__content">
              <table>
                <caption className="fr-sr-only">Source des données de chaque critère</caption>
                <thead className={CLASSES_ENTETE_TABLEAU}>
                  <tr>
                    <th scope="col" className="fr-cell--center">
                      Critère
                    </th>
                    <th scope="col" className="fr-cell--multiline fr-cell--center">
                      Source / Producteur
                    </th>
                    <th scope="col" className="fr-cell--center">
                      Mode d'appel
                    </th>
                    <th scope="col" className="fr-cell--multiline fr-cell--center">
                      Doc de la source
                    </th>
                    <th scope="col" className="fr-cell--multiline fr-cell--center">
                      Format de la source
                    </th>
                    <th scope="col" className="fr-cell--center">
                      Clé
                    </th>
                    <th scope="col" className="fr-cell--center">
                      Version
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {CRITERES_PAR_COEFFICIENT.map((critere) => (
                    <SourceRow
                      key={critere.cle}
                      critere={critere}
                      onClicLienSource={onClicLienSource}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <SourcesHorsCalcul onClicLienSource={onClicLienSource} />
    </>
  );
}
