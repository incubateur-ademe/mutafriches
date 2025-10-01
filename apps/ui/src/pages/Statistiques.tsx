import { Link } from "react-router-dom";
import { Layout } from "../layouts/Layout";

export function Statistiques() {
  const iframeUrl =
    "https://metabase.mutafriches.beta.gouv.fr/public/dashboard/7a332a97-33d9-43f8-a4cd-51cff2b8d25d";

  return (
    <Layout>
      <div className="content-editorial fr-col-12">
        <nav role="navigation" className="fr-breadcrumb" aria-label="vous êtes ici :">
          <button
            type="button"
            className="fr-breadcrumb__button"
            aria-expanded="false"
            aria-controls="breadcrumb"
          >
            Voir le Fil d'Ariane
          </button>
          <div className="fr-collapse" id="breadcrumb">
            <ol className="fr-breadcrumb__list">
              <li>
                <Link className="fr-breadcrumb__link" to="/">
                  Accueil
                </Link>
              </li>
              <li>
                <a className="fr-breadcrumb__link" aria-current="page">
                  Statistiques
                </a>
              </li>
            </ol>
          </div>
        </nav>

        <h1 id="tests">Statistiques Mutafriches</h1>
        <p className="fr-text--lead fr-mb-6w">
          Page de statistiques pour visualiser les données relatives aux mutafriches.
        </p>

        <iframe
          src={iframeUrl}
          style={{ width: "100%", minHeight: "800px", border: "none" }}
          title="Dashboard Metabase - Statistiques Mutafriches"
          allowFullScreen
        />
      </div>
    </Layout>
  );
}
