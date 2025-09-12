import React, { useState, useEffect } from "react";
import MutafrichesIframe from "./MutafrichesIframe";

/**
 * Exemple d'intégration Mutafriches avec le DSFR
 *
 * Prérequis : Ajouter le DSFR dans votre index.html :
 *
 * <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@gouvfr/dsfr@1.14.1/dist/dsfr.min.css">
 * <script src="https://cdn.jsdelivr.net/npm/@gouvfr/dsfr@1.14.1/dist/dsfr.min.js"></script>
 */
function AppDSFR() {
  // État pour les résultats et la progression
  const [results, setResults] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Configuration
  const config = {
    integrator: "test",
    callbackUrl: "http://localhost:3000/retour",
    callbackLabel: "Retour vers notre application",
    baseUrl: "http://localhost:3000", // Prod: https://mutafriches.beta.gouv.fr
  };

  // Initialiser les accordéons DSFR après le rendu
  useEffect(() => {
    if (window.dsfr) {
      window.dsfr.start();
    }
  }, [results]);

  // Handlers
  const handleReady = (data) => {
    console.log("Formulaire disponible", data);
  };

  const handleCompleted = (data) => {
    console.log("Analyse terminée", data);
    setResults(data.results);
    setIsCompleted(true);
    setShowSuccessAlert(true);

    // Cacher l'alerte après 5 secondes
    setTimeout(() => setShowSuccessAlert(false), 5000);
  };

  const handleStepChanged = (data) => {
    setCurrentStep(data.currentStep);
  };

  const handleError = (data) => {
    console.error("Erreur:", data.error);
  };

  const handleNewAnalysis = () => {
    setResults(null);
    setIsCompleted(false);
    setCurrentStep(0);
    window.location.reload();
  };

  return (
    <>
      {/* Header DSFR */}
      <header role="banner" className="fr-header">
        <div className="fr-header__body">
          <div className="fr-container">
            <div className="fr-header__body-row">
              <div className="fr-header__brand fr-enlarge-link">
                <div className="fr-header__brand-top">
                  <div className="fr-header__logo">
                    <p className="fr-logo">
                      République
                      <br />
                      Française
                    </p>
                  </div>
                </div>
                <div className="fr-header__service">
                  <p className="fr-header__service-title">Mon Application</p>
                  <p className="fr-header__service-tagline">
                    Intégration du formulaire Mutafriches
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main role="main">
        <div className="fr-container fr-py-6w">
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col">
              <h1>Analysez votre friche industrielle</h1>

              {/* Fil d'Ariane */}
              <nav role="navigation" className="fr-breadcrumb" aria-label="vous êtes ici :">
                <ol className="fr-breadcrumb__list">
                  <li>
                    <a className="fr-breadcrumb__link" href="/">
                      Accueil
                    </a>
                  </li>
                  <li>
                    <a className="fr-breadcrumb__link" aria-current="page">
                      Analyse de mutabilité
                    </a>
                  </li>
                </ol>
              </nav>

              {/* Alerte de succès */}
              {showSuccessAlert && (
                <div className="fr-alert fr-alert--success fr-mb-4w">
                  <h3 className="fr-alert__title">Analyse terminée avec succès</h3>
                  <p>Les résultats de l'analyse sont disponibles ci-dessous.</p>
                </div>
              )}

              {/* Indicateur de progression */}
              {currentStep > 0 && !isCompleted && (
                <div className="fr-callout fr-mb-4w">
                  <h3 className="fr-callout__title">Progression</h3>
                  <p className="fr-callout__text">Étape {currentStep} sur 3</p>
                  <div className="fr-progress fr-mt-2w" role="progressbar" aria-label="Progression">
                    <div
                      className="fr-progress__bar"
                      style={{ width: `${(currentStep / 3) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Carte principale avec l'iframe */}
              <div className="fr-card fr-card--no-border">
                <div className="fr-card__body">
                  <div className="fr-card__content">
                    <h2 className="fr-card__title">Formulaire d'analyse de mutabilité</h2>
                    <p className="fr-card__desc">
                      Remplissez le formulaire ci-dessous pour obtenir une analyse détaillée des
                      usages possibles de votre friche.
                    </p>
                  </div>

                  {/* Iframe Mutafriches */}
                  <div
                    style={{
                      border: "2px dashed var(--border-action-high-blue-france)",
                      borderRadius: "0.5rem",
                      padding: "1rem",
                      backgroundColor: "var(--background-alt-grey)",
                      marginTop: "2rem",
                    }}
                  >
                    <MutafrichesIframe
                      {...config}
                      onReady={handleReady}
                      onCompleted={handleCompleted}
                      onStepChanged={handleStepChanged}
                      onError={handleError}
                      height={900}
                    />
                  </div>
                </div>
              </div>

              {/* Résultats */}
              {results && (
                <div className="fr-mt-6w">
                  <h2>Résultats de l'analyse</h2>

                  {/* Top 3 des usages */}
                  <div className="fr-grid-row fr-grid-row--gutters fr-mb-4w">
                    {results.resultats.slice(0, 3).map((resultat, index) => (
                      <div key={index} className="fr-col-12 fr-col-md-4">
                        <div className="fr-card">
                          <div className="fr-card__body">
                            <div className="fr-card__content">
                              <h3 className="fr-card__title">
                                <span className="fr-badge fr-badge--green-emeraude fr-mr-1w">
                                  #{index + 1}
                                </span>
                                {resultat.libelle}
                              </h3>
                              <p className="fr-card__desc">
                                <strong>Score : {resultat.score}%</strong>
                                <br />
                                {resultat.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Fiabilité */}
                  <div className="fr-callout fr-callout--blue-ecume fr-mb-4w">
                    <h3 className="fr-callout__title">
                      Indice de fiabilité : {results.fiabilite.note}/10
                    </h3>
                    <p className="fr-callout__text">{results.fiabilite.description}</p>
                  </div>

                  {/* Tableau complet */}
                  <div className="fr-accordions-group">
                    <section className="fr-accordion">
                      <h3 className="fr-accordion__title">
                        <button
                          className="fr-accordion__btn"
                          aria-expanded="false"
                          aria-controls="accordion-results"
                        >
                          Voir tous les résultats
                        </button>
                      </h3>
                      <div className="fr-collapse" id="accordion-results">
                        <div className="fr-table">
                          <table>
                            <thead>
                              <tr>
                                <th scope="col">Rang</th>
                                <th scope="col">Usage</th>
                                <th scope="col">Score</th>
                                <th scope="col">Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {results.resultats.map((resultat, index) => (
                                <tr key={index}>
                                  <td>{index + 1}</td>
                                  <td>{resultat.libelle}</td>
                                  <td>
                                    <span className="fr-badge fr-badge--blue-ecume">
                                      {resultat.score}%
                                    </span>
                                  </td>
                                  <td>{resultat.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Actions */}
                  <div className="fr-btns-group fr-btns-group--center fr-mt-4w">
                    <button
                      className="fr-btn fr-btn--icon-left fr-icon-save-line"
                      onClick={() => console.log("Sauvegarder", results)}
                    >
                      Sauvegarder les résultats
                    </button>
                    <button
                      className="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-refresh-line"
                      onClick={handleNewAnalysis}
                    >
                      Nouvelle analyse
                    </button>
                  </div>
                </div>
              )}

              {/* Section d'aide */}
              <div className="fr-accordions-group fr-mt-6w">
                <section className="fr-accordion">
                  <h3 className="fr-accordion__title">
                    <button
                      className="fr-accordion__btn"
                      aria-expanded="false"
                      aria-controls="accordion-help"
                    >
                      Comment ça marche ?
                    </button>
                  </h3>
                  <div className="fr-collapse" id="accordion-help">
                    <div className="fr-grid-row fr-grid-row--gutters">
                      <div className="fr-col-12 fr-col-md-6">
                        <h4>Étapes du formulaire</h4>
                        <ol>
                          <li>Sélection de la parcelle</li>
                          <li>Caractéristiques du site</li>
                          <li>Résultats et recommandations</li>
                        </ol>
                      </div>
                      <div className="fr-col-12 fr-col-md-6">
                        <h4>Types d'usages analysés</h4>
                        <ul>
                          <li>Résidentiel ou mixte</li>
                          <li>Équipements publics</li>
                          <li>Culture et tourisme</li>
                          <li>Tertiaire</li>
                          <li>Industrie</li>
                          <li>Renaturation</li>
                          <li>Photovoltaïque au sol</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer DSFR */}
      <footer className="fr-footer" role="contentinfo">
        <div className="fr-container">
          <div className="fr-footer__body">
            <div className="fr-footer__brand fr-enlarge-link">
              <p className="fr-logo">
                République
                <br />
                Française
              </p>
            </div>
            <div className="fr-footer__content">
              <p className="fr-footer__content-desc">
                Application intégrant le service Mutafriches pour l'analyse de friches
                industrielles.
              </p>
              <ul className="fr-footer__content-list">
                <li className="fr-footer__content-item">
                  <a className="fr-footer__content-link" href="https://mutafriches.beta.gouv.fr">
                    mutafriches.beta.gouv.fr
                  </a>
                </li>
                <li className="fr-footer__content-item">
                  <a
                    className="fr-footer__content-link"
                    href="mailto:contact@mutafriches.beta.gouv.fr"
                  >
                    contact@mutafriches.beta.gouv.fr
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default AppDSFR;
