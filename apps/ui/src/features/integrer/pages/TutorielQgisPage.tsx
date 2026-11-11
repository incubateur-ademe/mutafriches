import { Link } from "react-router-dom";
import { Layout } from "../../../shared/components/layout/Layout";
import { ROUTES } from "../../../shared/config/routes.config";
import { EtapeTutoriel } from "../components/EtapeTutoriel";
import {
  ETAPES_TUTORIEL_QGIS,
  QUESTIONS_TUTORIEL_QGIS,
  URL_STANDARD_CNIG,
  URL_TELECHARGEMENT_EXTENSION,
  VERSION_QGIS_TESTEE,
} from "../data/tutoriel-qgis";

const CONTACT = "contact@mutafriches.beta.gouv.fr";

export function TutorielQgisPage() {
  return (
    <Layout>
      <div className="fr-col-12">
        <Link
          to={ROUTES.INTEGRER}
          className="fr-link fr-icon-arrow-left-line fr-link--icon-left fr-mb-3w inline-block"
        >
          Intégrer Mutafriches
        </Link>

        <h1>Utiliser l'extension QGIS</h1>
        <p className="fr-text--lead">
          Analysez la mutabilité de tout un inventaire de friches sans quitter votre SIG : envoyez
          vos sites, retrouvez-les sur la carte avec leur usage le plus compatible, et exploitez les
          résultats dans vos tables attributaires.
        </p>

        <div className="fr-grid-row fr-grid-row--gutters fr-mb-6w">
          <div className="fr-col-12 fr-col-md-7">
            <nav className="fr-summary" role="navigation" aria-labelledby="sommaire-tutoriel-qgis">
              <p className="fr-summary__title" id="sommaire-tutoriel-qgis">
                Sommaire
              </p>
              <ol>
                {ETAPES_TUTORIEL_QGIS.map((etape) => (
                  <li key={etape.id}>
                    <a className="fr-summary__link" href={`#${etape.id}`}>
                      {etape.titre}
                    </a>
                  </li>
                ))}
                <li>
                  <a className="fr-summary__link" href="#questions">
                    Questions fréquentes
                  </a>
                </li>
              </ol>
            </nav>
          </div>

          <div className="fr-col-12 fr-col-md-5">
            <div className="fr-callout fr-mb-0">
              <p className="fr-callout__title fr-h6">Avant de commencer</p>
              <ul className="fr-callout__text fr-text--md fr-pl-3w">
                <li>QGIS {VERSION_QGIS_TESTEE} ou plus récent, et une connexion Internet.</li>
                <li>
                  Un inventaire de sites au{" "}
                  <a
                    href={URL_STANDARD_CNIG}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Standard CNIG Friches - nouvelle fenêtre"
                  >
                    standard CNIG Friches
                  </a>
                  , ou le fichier exemple fourni par l'extension.
                </li>
              </ul>
              <a
                className="fr-btn fr-icon-download-line fr-btn--icon-left"
                href={URL_TELECHARGEMENT_EXTENSION}
                target="_blank"
                rel="noopener noreferrer"
                title="Télécharger l'extension - nouvelle fenêtre"
              >
                Télécharger l'extension
              </a>
            </div>
          </div>
        </div>

        {ETAPES_TUTORIEL_QGIS.map((etape, index) => (
          <EtapeTutoriel key={etape.id} numero={index + 1} etape={etape} />
        ))}

        <section id="questions" className="fr-mb-6w" aria-labelledby="questions-titre">
          <h2 id="questions-titre" className="fr-h3">
            Questions fréquentes
          </h2>
          <dl>
            {QUESTIONS_TUTORIEL_QGIS.map(({ question, reponse }) => (
              <div key={question} className="fr-mb-3w">
                <dt className="fr-text--bold">{question}</dt>
                <dd className="fr-ml-0">{reponse}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="fr-callout fr-callout--green-emeraude">
          <p className="fr-callout__title fr-h6">Ce qu'il faut savoir sur vos données</p>
          <ul className="fr-callout__text fr-text--md fr-pl-3w">
            <li>
              Seules les parcelles de vos sites sont transmises à Mutafriches. Votre structure et
              votre adresse mail restent sur votre poste.
            </li>
            <li>
              Un site analysé rejoint la table attributaire publique de sa commune, comme tout site
              évalué dans Mutafriches.
            </li>
            <li>
              Les critères de terrain lus dans votre fichier sont déclaratifs : ils ne sont pas
              vérifiés.
            </li>
          </ul>
        </div>

        <p className="fr-mt-4w">
          Une question, un inventaire volumineux ou un format particulier ? Écrivez-nous à{" "}
          <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. Pour intégrer Mutafriches à vos propres
          outils, consultez la{" "}
          <Link to={ROUTES.DOCUMENTATION_INTEGRATION}>documentation technique</Link>.
        </p>
      </div>
    </Layout>
  );
}
