import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../../../shared/components/layout/Layout";
import { DocumentationIframe } from "../components/DocumentationIframe";
import { DocumentationApi } from "../components/DocumentationApi";

type IntegrationMode = "iframe" | "api";

export function DocumentationIntegrationPage() {
  const [mode, setMode] = useState<IntegrationMode>("iframe");

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
                  Documentation d'intégration
                </a>
              </li>
            </ol>
          </div>
        </nav>

        <h1>Documentation d'intégration</h1>
        <p className="fr-text--lead fr-mb-6w">
          Intégrez Mutafriches dans votre plateforme en quelques minutes via iframe ou API REST.
        </p>

        {/* Mode d'intégration */}
        <fieldset className="fr-segmented">
          <legend className="fr-segmented__legend">Choisissez votre mode d'intégration</legend>
          <div className="fr-segmented__elements">
            <div className="fr-segmented__element">
              <input
                value="iframe"
                checked={mode === "iframe"}
                type="radio"
                id="mode-iframe"
                name="integration-mode"
                onChange={() => setMode("iframe")}
              />
              <label className="fr-icon-window-line fr-label" htmlFor="mode-iframe">
                Intégration iframe
              </label>
            </div>
            <div className="fr-segmented__element">
              <input
                value="api"
                checked={mode === "api"}
                type="radio"
                id="mode-api"
                name="integration-mode"
                onChange={() => setMode("api")}
              />
              <label className="fr-icon-code-line fr-label" htmlFor="mode-api">
                API REST
              </label>
            </div>
          </div>
        </fieldset>

        {/* Contenu dynamique selon le mode */}
        <div className="fr-mt-6w">
          {mode === "iframe" ? <DocumentationIframe /> : <DocumentationApi />}
        </div>

        {/* Contact */}
        <div className="fr-callout fr-callout--purple-glycine fr-mt-8w">
          <h3 className="fr-callout__title">Besoin d'aide ?</h3>
          <p className="fr-callout__text">
            Pour toute question technique, contactez-nous à :{" "}
            <a href="mailto:contact@mutafriches.beta.gouv.fr">contact@mutafriches.beta.gouv.fr</a>
          </p>
        </div>
      </div>
    </Layout>
  );
}
