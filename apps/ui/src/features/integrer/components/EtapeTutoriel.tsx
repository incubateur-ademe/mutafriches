import { DOSSIER_CAPTURES_QGIS, type EtapeTutorielQgis } from "../data/tutoriel-qgis";

interface EtapeTutorielProps {
  numero: number;
  etape: EtapeTutorielQgis;
}

/** Une étape du tutoriel : titre numéroté, texte, marche à suivre et captures agrandissables. */
export function EtapeTutoriel({ numero, etape }: EtapeTutorielProps) {
  return (
    <section id={etape.id} className="fr-mb-8w" aria-labelledby={`${etape.id}-titre`}>
      <h2 id={`${etape.id}-titre`} className="fr-h3">
        <span className="fr-badge fr-badge--info fr-badge--no-icon fr-mr-1w">Étape {numero}</span>
        <span className="block fr-mt-1w">{etape.titre}</span>
      </h2>

      {etape.paragraphes.map((paragraphe) => (
        <p key={paragraphe}>{paragraphe}</p>
      ))}

      {etape.actions && (
        <ol className="fr-mb-3w">
          {etape.actions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ol>
      )}

      {etape.captures.map((capture) => {
        const source = `${DOSSIER_CAPTURES_QGIS}/${capture.fichier}`;
        return (
          <figure key={capture.fichier} className="fr-content-media fr-mx-0">
            <div className="fr-content-media__img">
              <a
                href={source}
                target="_blank"
                rel="noopener noreferrer"
                title="Agrandir la capture - nouvelle fenêtre"
              >
                <img
                  className="fr-responsive-img"
                  style={{ border: "1px solid var(--border-default-grey)" }}
                  src={source}
                  alt={capture.alt}
                  loading="lazy"
                  width={1600}
                  height={1000}
                />
              </a>
            </div>
          </figure>
        );
      })}

      {etape.aSavoir && (
        <div className="fr-callout fr-callout--blue-ecume fr-mt-3w">
          <p className="fr-callout__title fr-h6">À savoir</p>
          <p className="fr-callout__text fr-text--md">{etape.aSavoir}</p>
        </div>
      )}
    </section>
  );
}
