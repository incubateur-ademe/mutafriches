import React from "react";
import { Link } from "react-router-dom";
import { Layout } from "@shared/components/layout/Layout";
import { ROUTES, partenaireRoute } from "@shared/config/routes.config";
import { PARTNERS } from "../../registry";

export const PartenairesPage: React.FC = () => {
  return (
    <Layout>
      <div className="fr-mb-4w">
        <h1 className="fr-h3">Partenaires</h1>
        <p className="fr-text--lg">
          Pages dédiées aux partenaires de Mutafriches pour la qualification et la mutabilité de
          listes de friches spécifiques à leur territoire.
        </p>
      </div>

      <div className="fr-callout fr-icon-database-line fr-mb-4w">
        <h2 className="fr-callout__title fr-h6">Sources de données et jeux de données</h2>
        <p className="fr-callout__text fr-text--sm">
          Consultez la liste des sources de données externes (APIs distantes) et des référentiels
          importés en base utilisés par Mutafriches pour enrichir les analyses.
        </p>
        <Link className="fr-btn fr-btn--secondary" to={ROUTES.DONNEES_EXTERNES}>
          Voir les données externes
        </Link>
      </div>

      <div className="fr-grid-row fr-grid-row--gutters">
        {PARTNERS.map((p) => (
          <div key={p.slug} className="fr-col-12 fr-col-md-6 fr-col-lg-4">
            <div className="fr-card fr-enlarge-link">
              <div className="fr-card__body">
                <div className="fr-card__content">
                  <h3 className="fr-card__title">
                    <Link to={partenaireRoute(p.slug)}>{p.nom}</Link>
                  </h3>
                  <p className="fr-card__desc">{p.description}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};
