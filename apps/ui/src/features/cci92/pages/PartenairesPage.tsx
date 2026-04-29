import React from "react";
import { Link } from "react-router-dom";
import { Layout } from "@shared/components/layout/Layout";
import { ROUTES } from "@shared/config/routes.config";

interface Partenaire {
  nom: string;
  description: string;
  to: string;
  logo?: string;
}

const PARTENAIRES: Partenaire[] = [
  {
    nom: "CCI Hauts-de-Seine (92)",
    description:
      "POC de qualification et mutabilité des friches sur le territoire de la CCI 92 (Colombes, Gennevilliers, Nanterre).",
    to: ROUTES.CCI_92,
  },
];

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

      <div className="fr-grid-row fr-grid-row--gutters">
        {PARTENAIRES.map((p) => (
          <div key={p.to} className="fr-col-12 fr-col-md-6 fr-col-lg-4">
            <div className="fr-card fr-enlarge-link">
              <div className="fr-card__body">
                <div className="fr-card__content">
                  <h3 className="fr-card__title">
                    <Link to={p.to}>{p.nom}</Link>
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
