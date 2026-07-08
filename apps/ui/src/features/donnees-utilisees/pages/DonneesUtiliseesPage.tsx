import { Link } from "react-router-dom";
import { Layout } from "../../../shared/components/layout/Layout";
import { DsfrTabs } from "../../../shared/components/dsfr/DsfrTabs";
import { ImportsPanel } from "../components/ImportsPanel";
import { ApisExternesPanel } from "../components/ApisExternesPanel";
import { ROUTES } from "../../../shared/config/routes.config";

export function DonneesUtiliseesPage() {
  return (
    <Layout>
      <div className="content-editorial fr-col-12">
        <nav role="navigation" className="fr-breadcrumb" aria-label="vous êtes ici :">
          <button
            type="button"
            className="fr-breadcrumb__button"
            aria-expanded="false"
            aria-controls="breadcrumb-donnees-utilisees"
          >
            Voir le Fil d'Ariane
          </button>
          <div className="fr-collapse" id="breadcrumb-donnees-utilisees">
            <ol className="fr-breadcrumb__list">
              <li>
                <Link className="fr-breadcrumb__link" to="/">
                  Accueil
                </Link>
              </li>
              <li>
                <a className="fr-breadcrumb__link" aria-current="page">
                  Données utilisées
                </a>
              </li>
            </ol>
          </div>
        </nav>

        <h1 id="donnees-utilisees">Données utilisées</h1>
        <p className="fr-text--lead fr-mb-6w">
          Vue d'ensemble des sources de données externes utilisées par Mutafriches : les APIs
          distantes interrogées pour enrichir automatiquement les analyses et les référentiels
          importés en base.
        </p>

        <div className="fr-callout fr-mb-6w">
          <h2 className="fr-callout__title fr-h5">Documentation détaillée des sources</h2>
          <p className="fr-callout__text fr-text--sm">
            Pour chaque source : les champs récupérés, leur traitement dans l'algorithme et les
            critères d'évaluation qu'ils alimentent.
          </p>
          <Link className="fr-btn fr-btn--secondary" to={ROUTES.DOCUMENTATION_SOURCES}>
            Consulter la documentation des sources
          </Link>
        </div>

        <DsfrTabs
          ariaLabel="Données utilisées : sélection de l'onglet"
          tabs={[
            { id: "apis", label: "APIs externes", panel: <ApisExternesPanel /> },
            { id: "imports", label: "Imports", panel: <ImportsPanel /> },
          ]}
        />
      </div>
    </Layout>
  );
}
