import { Link } from "react-router-dom";
import { useState } from "react";
import { Layout } from "@/shared/components/layout/Layout";
import { TestEnrichmentDisplay } from "../components/TestEnrichmentDisplay";
import type { EnrichissementOutputDto } from "@mutafriches/shared-types";
import { EnrichmentTestSelection } from "../components/EnrichmentTestSelection";

export function TestEnrichment() {
  const [enrichmentData, setEnrichmentData] = useState<EnrichissementOutputDto | null>(null);

  const handleEnrichmentComplete = (data: EnrichissementOutputDto) => {
    setEnrichmentData(data);

    // Scroll vers les résultats
    setTimeout(() => {
      const element = document.getElementById("test-enrichment-results");
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

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
          <p className="fr-text--lead">
            Testez l'enrichissement automatique des données de parcelle depuis les APIs externes
          </p>
        </div>

        {/* Zone de sélection */}
        <div className="fr-mb-6w">
          <EnrichmentTestSelection onEnrichmentComplete={handleEnrichmentComplete} />
        </div>

        {/* Zone de résultats */}
        {enrichmentData && (
          <div id="test-enrichment-results">
            <TestEnrichmentDisplay data={enrichmentData} />
          </div>
        )}
      </div>
    </Layout>
  );
}
