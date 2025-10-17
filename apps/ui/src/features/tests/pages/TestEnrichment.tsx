import { Link } from "react-router-dom";
import { Layout } from "../../../shared/components/layout/Layout";

export function TestEnrichment() {
  return (
    <Layout>
      <div className="fr-container-fluid">
        {/* En-tête */}
        <div className="fr-mb-6w">
          <nav role="navigation" className="fr-breadcrumb" aria-label="vous êtes ici :">
            <button
              type="button"
              className="fr-breadcrumb__button"
              aria-expanded="false"
              aria-controls="breadcrumb-test"
            >
              Voir le Fil d'Ariane
            </button>
            <div className="fr-collapse" id="breadcrumb-test">
              <ol className="fr-breadcrumb__list">
                <li>
                  <Link className="fr-breadcrumb__link" to="/">
                    Accueil
                  </Link>
                </li>
                <li>
                  <Link className="fr-breadcrumb__link" to="/tests">
                    Tests
                  </Link>
                </li>
                <li>
                  <a className="fr-breadcrumb__link" aria-current="page">
                    Test Enrichissement de parcelle
                  </a>
                </li>
              </ol>
            </div>
          </nav>

          <h1>Test d'enrichissement de Parcelle</h1>
        </div>

        {/* Grille de test des composants */}
        <div className="fr-callout">
          <h3 className="fr-callout__title">Information importante</h3>
          <p className="fr-callout__text">
            Work in progress - Cette page est en cours de développement.
          </p>
        </div>
      </div>
    </Layout>
  );
}
