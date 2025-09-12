import { Layout } from "../../layouts";
import { Link } from "react-router-dom";

export function TestEnrichment() {
  return (
    <Layout>
      <div className="fr-container">
        <div className="fr-my-6w">
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

            <h1>Test de l'enrichissement de Parcelle</h1>
            <p className="fr-text--lead">Work In Progress</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
