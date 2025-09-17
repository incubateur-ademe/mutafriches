import { useState, useEffect } from "react";

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  iframeUrl: "https://mutafriches.beta.gouv.fr", // URL de l'iframe Mutafriches
  expectedOrigin: "https://mutafriches.beta.gouv.fr", // Origine attendue des messages

  // Paramètres de l'iframe
  params: {
    integrator: "demo",
    callbackUrl: "https://localhost", // Votre URL de redirection après analyse
    callbackLabel: "Retour vers notre site",
  },
};

// ============================================
// TYPES D'ÉVÉNEMENTS MUTAFRICHES
// ============================================
const EVENTS = {
  COMPLETED: "mutafriches:completed", // Analyse terminée
  ERROR: "mutafriches:error", // Erreur dans le formulaire
};

// ============================================
// HOOK PERSONNALISÉ POUR MUTAFRICHES
// ============================================
function useMutafriches(config) {
  const [status, setStatus] = useState("loading"); // loading, completed, error
  const [evaluationSummary, setEvaluationSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleMessage = (event) => {
      // Vérification de l'origine
      if (event.origin !== config.expectedOrigin) return;

      const { type, data } = event.data || {};

      switch (type) {
        case EVENTS.COMPLETED:
          setStatus("completed");
          setEvaluationSummary(data);
          console.log("Analyse terminée", data);
          break;

        case EVENTS.ERROR:
          setStatus("error");
          setError(data?.error || "Erreur inconnue");
          console.error("Erreur Mutafriches", data);
          break;

        default:
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [config.expectedOrigin]);

  return { status, evaluationSummary, error };
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
function App() {
  // Utilisation du hook Mutafriches
  const { status, evaluationSummary, error } = useMutafriches(CONFIG);

  // Construction de l'URL avec les paramètres
  const buildIframeUrl = () => {
    const url = new URL(CONFIG.iframeUrl);
    Object.entries(CONFIG.params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    return url.toString();
  };

  // Scroll automatique vers les résultats
  useEffect(() => {
    if (evaluationSummary) {
      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [evaluationSummary]);

  return (
    <>
      {/* Header DSFR minimal */}
      <header role="banner" className="fr-header">
        <div className="fr-header__body">
          <div className="fr-container">
            <div className="fr-header__body-row">
              <div className="fr-header__brand">
                <div className="fr-header__service">
                  <p className="fr-header__service-title">Test d'intégration Mutafriches</p>
                  <p className="fr-header__service-tagline">
                    Intégration de l'iframe d'analyse de mutabilité des friches
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="fr-container fr-py-6w">
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12">
            <h1>Analyse de mutabilité des friches</h1>

            {/* Bandeau de configuration */}
            <div className="fr-callout">
              <h3 className="fr-callout__title">Configuration</h3>
              <p className="fr-callout__text">
                <strong>URL :</strong> <code>{CONFIG.iframeUrl}</code>
              </p>
              <p className="fr-callout__text">
                <strong>Intégrateur :</strong> {CONFIG.params.integrator}
              </p>
              <p className="fr-callout__text">
                <strong>Label du bouton de callback :</strong> {CONFIG.params.callbackLabel}
              </p>
              <p className="fr-callout__text">
                <strong>Lien du callback :</strong> {CONFIG.params.callbackUrl}
              </p>
            </div>

            {/* Gestion des erreurs */}
            {status === "error" && (
              <div className="fr-alert fr-alert--error">
                <p className="fr-alert__title">Erreur</p>
                <p>{error}</p>
              </div>
            )}

            {/* Iframe */}
            <div className="fr-mb-3w">
              <div
                style={{
                  border: "3px dashed var(--border-action-high-blue-france, #000091)",
                  borderRadius: "8px",
                  padding: "1rem",
                  backgroundColor: "var(--background-alt-blue-france, #f5f5fe)",
                }}
              >
                <p
                  className="fr-text--sm fr-mb-2w"
                  style={{
                    color: "var(--text-action-high-blue-france, #000091)",
                    fontWeight: "500",
                  }}
                >
                  Zone d'intégration iframe Mutafriches
                </p>
                <iframe
                  src={buildIframeUrl()}
                  title="Formulaire Mutafriches"
                  width="100%"
                  height="800"
                  style={{
                    border: "none",
                    display: "block",
                    borderRadius: "4px",
                    backgroundColor: "white",
                  }}
                />
              </div>
            </div>

            {/* Résultats */}
            {evaluationSummary && (
              <div id="results" className="fr-mb-3w">
                <div className="fr-alert fr-alert--success fr-mb-3w">
                  <p className="fr-alert__title">Analyse terminée avec succès</p>
                </div>

                <h2>Résultats de l'analyse</h2>

                {/* Carte résumé principal */}
                <div className="fr-card fr-mb-3w">
                  <div className="fr-card__body">
                    <h4 className="fr-card__title">Informations de l'évaluation</h4>
                    <div className="fr-card__desc">
                      <p>
                        <strong>ID de l'évaluation :</strong> {evaluationSummary.evaluationId}
                      </p>
                      <p>
                        <strong>Parcelle analysée :</strong> {evaluationSummary.identifiantParcelle}
                      </p>
                      <p>
                        <strong>Date d'analyse :</strong>{" "}
                        {new Date(evaluationSummary.metadata?.dateAnalyse).toLocaleDateString(
                          "fr-FR",
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fiabilité */}
                <div className="fr-card fr-mb-3w">
                  <div className="fr-card__body">
                    <h4 className="fr-card__title">Fiabilité de l'analyse</h4>
                    <div className="fr-card__desc">
                      <p className="fr-text--lg">
                        <strong>{evaluationSummary.fiabilite.note}/10</strong> -{" "}
                        {evaluationSummary.fiabilite.text}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Usage principal */}
                <div className="fr-highlight">
                  <h3>Usage principal recommandé</h3>
                  <p className="fr-text--lg">
                    <strong>{evaluationSummary.usagePrincipal.usage}</strong>
                  </p>
                  <p>
                    Indice de mutabilité :{" "}
                    <strong>{evaluationSummary.usagePrincipal.indiceMutabilite}%</strong>
                    <br />
                    Potentiel :{" "}
                    <span className="fr-badge fr-badge--success">
                      {evaluationSummary.usagePrincipal.potentiel}
                    </span>
                  </p>
                </div>

                {/* Top 3 des usages */}
                <div className="fr-mt-3w">
                  <h3>Top 3 des usages recommandés</h3>
                  <div className="fr-grid-row fr-grid-row--gutters">
                    {evaluationSummary.top3Usages.map((usage, index) => (
                      <div key={usage.usage} className="fr-col-12 fr-col-md-4">
                        <div className="fr-card">
                          <div className="fr-card__body">
                            <h5 className="fr-card__title">
                              #{usage.rang} - {usage.usage}
                            </h5>
                            <p className="fr-card__desc">
                              Indice : <strong>{usage.indiceMutabilite}%</strong>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Récupération de l'évaluation complète */}
                <div className="fr-callout fr-callout--blue-ecume fr-mt-3w">
                  <h3 className="fr-callout__title">Pour aller plus loin</h3>
                  <p className="fr-callout__text">
                    Vous pouvez récupérer l'évaluation complète via l'API :
                  </p>
                  <code className="fr-text--sm">
                    GET https://mutafriches.beta.gouv.fr/friches/evaluations/
                    {evaluationSummary.evaluationId}
                  </code>
                  <button
                    className="fr-btn fr-btn--sm fr-mt-2w"
                    onClick={() => {
                      fetch(
                        `https://mutafriches.beta.gouv.fr/friches/evaluations/${evaluationSummary.evaluationId}`,
                      )
                        .then((res) => res.json())
                        .then((data) => console.log("Évaluation complète:", data))
                        .catch((err) => console.error("Erreur:", err));
                    }}
                  >
                    Récupérer l'évaluation complète (voir console)
                  </button>
                </div>

                {/* Données brutes pour debug */}
                <details className="fr-mt-3w">
                  <summary>Voir les données brutes (JSON)</summary>
                  <pre
                    style={{
                      backgroundColor: "#f6f6f6",
                      padding: "1rem",
                      borderRadius: "4px",
                      overflow: "auto",
                    }}
                  >
                    {JSON.stringify(evaluationSummary, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fr-footer" role="contentinfo" id="footer">
        <div className="fr-container">
          <div className="fr-footer__body">
            <div className="fr-footer__brand fr-enlarge-link">
              <a id="brand-link" title="Retour à l'accueil du site - République Française" href="/">
                <p className="fr-logo">
                  {" "}
                  Intégration <br />
                  Mutafriches{" "}
                </p>
              </a>
            </div>
            <div className="fr-footer__content">
              <p className="fr-footer__content-desc">
                Ceci est une page de démonstration pour l'intégration de l'iframe Mutafriches
              </p>
            </div>
          </div>
          <div className="fr-footer__bottom">
            <ul className="fr-footer__bottom-list">
              <li className="fr-footer__bottom-item">
                <a id="footer__bottom-link-4" href="#" className="fr-footer__bottom-link">
                  Plan du site
                </a>
              </li>
              <li className="fr-footer__bottom-item">
                <a id="footer__bottom-link-5" href="#" className="fr-footer__bottom-link">
                  Accessibilité : non/partiellement/totalement conforme
                </a>
              </li>
              <li className="fr-footer__bottom-item">
                <a id="footer__bottom-link-6" href="#" className="fr-footer__bottom-link">
                  Mentions légales
                </a>
              </li>
              <li className="fr-footer__bottom-item">
                <a id="footer__bottom-link-7" href="#" className="fr-footer__bottom-link">
                  Données personnelles
                </a>
              </li>
              <li className="fr-footer__bottom-item">
                <a id="footer__bottom-link-8" href="#" className="fr-footer__bottom-link">
                  Gestion des cookies
                </a>
              </li>
            </ul>
            <div className="fr-footer__bottom-copy">
              <p>
                Sauf mention explicite de propriété intellectuelle détenue par des tiers, les
                contenus de ce site sont proposés sous{" "}
                <a
                  href="https://github.com/etalab/licence-ouverte/blob/master/LO.md"
                  target="_blank"
                  rel="noopener external"
                  title="Licence etalab - nouvelle fenêtre"
                >
                  licence etalab-2.0
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;
