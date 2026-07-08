import { useState } from "react";
import { Link } from "react-router-dom";
import {
  SOURCES_DONNEES,
  getCriteresManuels,
  getCriteresPourSource,
  type CritereMetadata,
  type SourceDonnees,
} from "@mutafriches/shared-types";
import { Layout } from "../../../shared/components/layout/Layout";
import { ROUTES } from "../../../shared/config/routes.config";
import { generateSourcesPdf } from "../export/generateSourcesPdf";

const TYPE_LABELS: Record<SourceDonnees["type"], string> = {
  "api-externe": "API externe",
  "referentiel-local": "Référentiel local",
};

// Tableau des critères alimentés (libellé + poids)
function CriteresTable({ criteres }: { criteres: CritereMetadata[] }) {
  return (
    <div className="fr-table fr-table--bordered fr-mb-0">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table>
              <thead>
                <tr>
                  <th scope="col">Critère d'évaluation alimenté</th>
                  <th scope="col">Poids</th>
                </tr>
              </thead>
              <tbody>
                {criteres.map((critere) => (
                  <tr key={critere.key}>
                    <td>{critere.label}</td>
                    <td>{critere.poids}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceAccordion({ source }: { source: SourceDonnees }) {
  const criteres = getCriteresPourSource(source);
  return (
    <section className="fr-accordion">
      <h3 className="fr-accordion__title">
        <button
          type="button"
          className="fr-accordion__btn"
          aria-expanded="false"
          aria-controls={`accordion-source-${source.id}`}
        >
          {source.nom}
        </button>
      </h3>
      <div className="fr-collapse" id={`accordion-source-${source.id}`}>
        <p className="fr-mb-2w">
          <span className="fr-badge fr-badge--sm fr-badge--blue-cumulus fr-mr-1w">
            {TYPE_LABELS[source.type]}
          </span>
          <span className="fr-text--sm">Opérateur : {source.organisme}</span>
        </p>

        <h4 className="fr-text--md fr-mb-1w">Champs récupérés</h4>
        <ul className="fr-mb-3w">
          {source.champsRecuperes.map((champ) => (
            <li key={champ}>{champ}</li>
          ))}
        </ul>

        <h4 className="fr-text--md fr-mb-1w">Traitement dans l'algorithme</h4>
        <p className="fr-mb-3w">{source.traitementAlgo}</p>

        <h4 className="fr-text--md fr-mb-1w">Critères d'évaluation alimentés</h4>
        <CriteresTable criteres={criteres} />

        <p className="fr-mt-2w fr-mb-0">
          <a href={source.urlDoc} target="_blank" rel="noopener noreferrer">
            Documentation de la source
          </a>
        </p>
      </div>
    </section>
  );
}

export function DocumentationSourcesPage() {
  const criteresManuels = getCriteresManuels();
  const [pdfEnCours, setPdfEnCours] = useState(false);

  const telechargerPdf = async () => {
    setPdfEnCours(true);
    try {
      await generateSourcesPdf();
    } finally {
      setPdfEnCours(false);
    }
  };

  return (
    <Layout>
      <div className="content-editorial fr-col-12">
        <nav role="navigation" className="fr-breadcrumb" aria-label="vous êtes ici :">
          <button
            type="button"
            className="fr-breadcrumb__button"
            aria-expanded="false"
            aria-controls="breadcrumb-documentation-sources"
          >
            Voir le Fil d'Ariane
          </button>
          <div className="fr-collapse" id="breadcrumb-documentation-sources">
            <ol className="fr-breadcrumb__list">
              <li>
                <Link className="fr-breadcrumb__link" to={ROUTES.HOME}>
                  Accueil
                </Link>
              </li>
              <li>
                <Link className="fr-breadcrumb__link" to={ROUTES.DONNEES_UTILISEES}>
                  Données utilisées
                </Link>
              </li>
              <li>
                <a className="fr-breadcrumb__link" aria-current="page">
                  Documentation des sources
                </a>
              </li>
            </ol>
          </div>
        </nav>

        <h1>Documentation des sources de données</h1>
        <p className="fr-text--lead fr-mb-4w">
          Pour chaque source de données externe mobilisée par Mutafriches : les champs récupérés, la
          façon dont ils sont traités dans l'algorithme de mutabilité, et les critères d'évaluation
          qu'ils alimentent.
        </p>

        <div className="fr-callout fr-mb-6w">
          <h2 className="fr-callout__title fr-h4">Comment sont utilisées ces données</h2>
          <p className="fr-callout__text fr-text--sm">
            L'analyse de mutabilité repose sur 27 critères, notés pour 7 usages possibles d'une
            friche. 17 critères sont <strong>enrichis automatiquement</strong> à partir des sources
            ci-dessous ; 10 sont <strong>saisis manuellement</strong> par l'utilisateur. Chaque
            critère porte un poids ; le poids total est de 29,5. La part des critères effectivement
            renseignés détermine l'indice de fiabilité de l'analyse.
          </p>
        </div>

        <div className="fr-mb-6w">
          <button
            type="button"
            className="fr-btn fr-btn--secondary fr-icon-download-line fr-btn--icon-left"
            onClick={telechargerPdf}
            disabled={pdfEnCours}
          >
            {pdfEnCours ? "Génération du PDF…" : "Télécharger en PDF"}
          </button>
        </div>

        <h2 className="fr-h3">Sources enrichies automatiquement</h2>
        <p className="fr-mb-3w">
          {SOURCES_DONNEES.length} sources de données (APIs distantes et référentiels importés en
          base) sont interrogées automatiquement à partir de l'identifiant cadastral du site.
        </p>

        <div className="fr-accordions-group fr-mb-6w">
          {SOURCES_DONNEES.map((source) => (
            <SourceAccordion key={source.id} source={source} />
          ))}
        </div>

        <h2 className="fr-h3">Critères saisis manuellement</h2>
        <p className="fr-mb-3w">
          Ces critères ne proviennent pas d'une source externe : ils sont renseignés par
          l'utilisateur lors de la qualification du site. Le raccordement à l'eau est un cas
          particulier, dérivé automatiquement de la surface bâtie (cf. ADR-0019).
        </p>
        <CriteresTable criteres={criteresManuels} />
      </div>
    </Layout>
  );
}
