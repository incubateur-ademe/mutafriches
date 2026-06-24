import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@shared/config/routes.config";

// Lien partagé vers la page des sources de données externes et référentiels.
export const DonneesExternesLink: React.FC = () => (
  <Link className="fr-link fr-icon-database-line fr-link--icon-left" to={ROUTES.DONNEES_UTILISEES}>
    Sources de données et jeux de données
  </Link>
);
