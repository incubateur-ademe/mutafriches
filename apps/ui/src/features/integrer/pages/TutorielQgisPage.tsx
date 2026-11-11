import { Link } from "react-router-dom";
import { Layout } from "../../../shared/components/layout/Layout";
import { ROUTES } from "../../../shared/config/routes.config";
import { DsfrAccordion } from "../../../shared/components/dsfr/DsfrAccordion";
import { DsfrSideMenu } from "../../../shared/components/dsfr/DsfrSideMenu";
import { EtapeTutoriel } from "../components/EtapeTutoriel";
import {
  ETAPES_TUTORIEL_QGIS,
  QUESTIONS_TUTORIEL_QGIS,
  URL_STANDARD_CNIG,
  URL_TELECHARGEMENT_EXTENSION,
  VERSION_QGIS_TESTEE,
} from "../data/tutoriel-qgis";

const CONTACT = "contact@mutafriches.beta.gouv.fr";

// Étapes puis questions fréquentes, dans l'ordre de la page
const SOMMAIRE = [
  ...ETAPES_TUTORIEL_QGIS.map((etape, index) => ({
    id: etape.id,
    label: `${index + 1}. ${etape.titre}`,
  })),
  { id: "questions", label: "Questions fréquentes" },
];

export function TutorielQgisPage() {
  return (
    <Layout>
      <div className="fr-col-12">
        <nav role="navigation" className="fr-breadcrumb" aria-label="vous êtes ici :">
          <button
            type="button"
            className="fr-breadcrumb__button"
            aria-expanded="false"
            aria-controls="breadcrumb-tutoriel-qgis"
          >
            Voir le fil d'Ariane
          </button>
          <div className="fr-collapse" id="breadcrumb-tutoriel-qgis">
            <ol className="fr-breadcrumb__list">
              <li>
                <Link className="fr-breadcrumb__link" to={ROUTES.HOME}>
                  Accueil
                </Link>
              </li>
              <li>
                <Link className="fr-breadcrumb__link" to={ROUTES.INTEGRER}>
                  Intégrer Mutafriches
                </Link>
              </li>
              <li>
                <a className="fr-breadcrumb__link" aria-current="page">
                  Extension QGIS
                </a>
              </li>
            </ol>
          </div>
        </nav>

        <h1>Utiliser l'extension QGIS</h1>
        <p className="fr-text--lead">
          Comparez les résultats sur plusieurs sites en friche de votre territoire sans quitter
          votre SIG, et identifiez plus facilement les opportunités pour construire votre stratégie
          territoriale : envoyez votre inventaire, retrouvez chaque site sur la carte avec ses
          usages les plus compatibles, et exploitez les indices de mutabilité dans vos tables
          attributaires.
        </p>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-4 fr-col-lg-3">
            <DsfrSideMenu id="sommaire-tutoriel-qgis" titre="Sommaire" items={SOMMAIRE} />
          </div>

          <div className="fr-col-12 fr-col-md-8 fr-col-lg-9">
            <div className="fr-callout fr-mb-6w">
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

            {ETAPES_TUTORIEL_QGIS.map((etape, index) => (
              <EtapeTutoriel key={etape.id} numero={index + 1} etape={etape} />
            ))}

            <section id="questions" className="fr-mb-6w" aria-labelledby="questions-titre">
              <h2 id="questions-titre" className="fr-h3">
                Questions fréquentes
              </h2>
              <div className="fr-accordions-group">
                {QUESTIONS_TUTORIEL_QGIS.map(({ id, question, reponse }) => (
                  <DsfrAccordion key={id} id={`question-${id}`} title={question}>
                    <p className="fr-mb-0">{reponse}</p>
                  </DsfrAccordion>
                ))}
              </div>
            </section>

            <p className="fr-mt-4w">
              Une question, un inventaire volumineux ou un format particulier ?
              <br />
              Écrivez-nous à <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
              <br />
              Pour intégrer Mutafriches à vos propres outils, consultez la{" "}
              <Link to={ROUTES.DOCUMENTATION_INTEGRATION}>documentation technique</Link>.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
