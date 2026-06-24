import { Link } from "react-router-dom";
import { Layout } from "@shared/components/layout/Layout";
import { DsfrTabs } from "@shared/components/dsfr/DsfrTabs";
import { DiagnosticIduTab } from "../components/DiagnosticIduTab";
import { InfosParcelleTab } from "../components/InfosParcelleTab";
import { LIEN_CADASTRE } from "../geoportail";

export function DiagnosticParcellePage() {
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
                  Diagnostic parcelle
                </a>
              </li>
            </ol>
          </div>
        </nav>

        <h1 id="diagnostic-parcelle">Diagnostic parcelle</h1>
        <p className="fr-text--lead fr-mb-1w">
          Diagnostiquer un IDU (trouvé ou rejeté par le cadastre IGN) ou retrouver l'IDU et les
          informations d'une parcelle depuis la carte ou une adresse.
        </p>
        <p className="fr-mb-4w">
          <a
            className="fr-link fr-icon-external-link-line fr-link--icon-right"
            href={LIEN_CADASTRE}
            target="_blank"
            rel="noopener noreferrer"
          >
            Consulter le cadastre (Géoportail IGN)
          </a>
        </p>

        <DsfrTabs
          ariaLabel="Diagnostic parcelle : sélection de l'onglet"
          tabs={[
            { id: "idu", label: "Diagnostic IDU", panel: <DiagnosticIduTab /> },
            { id: "infos", label: "Infos parcelle", panel: <InfosParcelleTab /> },
          ]}
        />
      </div>
    </Layout>
  );
}
