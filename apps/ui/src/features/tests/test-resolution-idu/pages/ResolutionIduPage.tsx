import { Link } from "react-router-dom";
import { Layout } from "@shared/components/layout/Layout";
import { DsfrTabs } from "@shared/components/dsfr/DsfrTabs";
import { NumeroParcelleTab } from "../components/NumeroParcelleTab";
import { CoordonneesTab } from "../components/CoordonneesTab";

export function ResolutionIduPage() {
  return (
    <Layout>
      <div className="content-editorial fr-col-12">
        <nav role="navigation" className="fr-breadcrumb" aria-label="vous êtes ici :">
          <div className="fr-collapse" id="breadcrumb">
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
                  Résolution d'IDU
                </a>
              </li>
            </ol>
          </div>
        </nav>

        <h1>Résolution d'IDU cadastral</h1>
        <p className="fr-text--lead fr-mb-4w">
          Retrouver l'identifiant unique de parcelle (IDU) à partir d'un numéro de parcelle ou de
          coordonnées, via l'API Carto Cadastre (IGN).
        </p>

        <DsfrTabs
          ariaLabel="Résolution d'IDU : sélection du mode"
          tabs={[
            { id: "numero", label: "Par numéro de parcelle", panel: <NumeroParcelleTab /> },
            { id: "coordonnees", label: "Par coordonnées (WGS84)", panel: <CoordonneesTab /> },
          ]}
        />
      </div>
    </Layout>
  );
}
