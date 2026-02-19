import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../../../shared/components/layout/Layout";
import { metabaseService } from "../../../shared/services/api/api.metabase.service";

export function StatistiquesPage() {
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    metabaseService
      .getEmbedUrl()
      .then((url: string) => {
        setIframeUrl(url);
      })
      .catch(() => {
        setError("Impossible de charger le dashboard statistiques.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <Layout>
      <div className="content-editorial fr-col-12">
        <nav role="navigation" className="fr-breadcrumb" aria-label="vous etes ici :">
          <button
            type="button"
            className="fr-breadcrumb__button"
            aria-expanded="false"
            aria-controls="breadcrumb-statistiques"
          >
            Voir le Fil d'Ariane
          </button>
          <div className="fr-collapse" id="breadcrumb-statistiques">
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

        {loading && (
          <div className="fr-callout">
            <p className="fr-callout__text">Chargement du dashboard statistiques...</p>
          </div>
        )}

        {error && (
          <div className="fr-alert fr-alert--error fr-mb-4w">
            <h3 className="fr-alert__title">Erreur</h3>
            <p>{error}</p>
          </div>
        )}

        {iframeUrl && (
          <iframe
            src={iframeUrl}
            title="Dashboard statistiques Mutafriches"
            width="100%"
            height="800"
            style={{ border: "none" }}
          />
        )}
      </div>
    </Layout>
  );
}
