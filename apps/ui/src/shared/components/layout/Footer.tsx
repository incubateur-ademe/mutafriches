import { ROUTES } from "../../config/routes.config";

export function Footer() {
  return (
    <>
      <footer className="fr-footer" role="contentinfo" id="footer-7361">
        <div className="fr-container">
          <div className="fr-footer__body">
            <div className="fr-footer__brand fr-enlarge-link">
              <a href="/" title={`Accueil - Mutafriches - ADEME`}>
                <p className="fr-logo">Mutafriches</p>
              </a>
            </div>
            <div className="fr-footer__content">
              <div className="fr-footer__content-desc [&_a]:after:content-none!">
                <p className="fr-text--sm">
                  Mutafriches est un service public conçu par l'ADEME (Agence de la transition
                  écologique) en partenariat avec le programme beta.gouv de la DINUM.{" "}
                </p>
                <p className="fr-text--sm fr-mt-2v">
                  Mutafriches est en phase d'expérimentation et vise à accompagner les collectivités
                  et acteurs de l'aménagement dans la réhabilitation des friches urbaines.{" "}
                </p>
              </div>
            </div>
          </div>
          <div className="fr-footer__bottom">
            <ul className="fr-footer__bottom-list">
              <li className="fr-footer__bottom-item" key="mentions-legales">
                <a className="fr-footer__bottom-link" href="/mentions-legales">
                  Mentions légales
                </a>
              </li>
              <li className="fr-footer__bottom-item" key="accessibilite">
                <a className="fr-footer__bottom-link" href="/accessibilite">
                  Accessibilité : non conforme
                </a>
              </li>
              <li className="fr-footer__bottom-item">
                <button
                  aria-controls="footer-display"
                  data-fr-opened="false"
                  id="footer__bottom-link-13"
                  className="fr-icon-theme-fill fr-btn--icon-left fr-footer__bottom-link"
                >
                  Paramètres d'affichage
                </button>
              </li>
              <li className="fr-footer__bottom-item">
                <a className="fr-footer__bottom-link" href={ROUTES.TESTS}>
                  Pages de tests
                </a>
              </li>
            </ul>
            <div className="fr-footer__bottom-copy">
              <p>
                Sauf mention explicite de propriété intellectuelle détenue par des tiers, les
                contenus de ce site sont proposés sous{" "}
                <a
                  href="https://github.com/etalab/licence-ouverte/blob/master/LO.md"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  licence etalab-2.0
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
      <dialog id="footer-display" className="fr-modal" aria-labelledby="footer-display-title">
        <div className="fr-container fr-container--fluid fr-container-md">
          <div className="fr-grid-row fr-grid-row--center">
            <div className="fr-col-12 fr-col-md-6 fr-col-lg-4">
              <div className="fr-modal__body">
                <div className="fr-modal__header">
                  <button
                    aria-controls="footer-display"
                    title="Fermer"
                    type="button"
                    id="button-14"
                    className="fr-btn--close fr-btn"
                  >
                    Fermer
                  </button>
                </div>
                <div className="fr-modal__content">
                  <h2 id="footer-display-title" className="fr-modal__title">
                    {" "}
                    Paramètres d’affichage{" "}
                  </h2>
                  <div id="fr-display" className="fr-display">
                    <fieldset
                      className="fr-fieldset"
                      id="display-fieldset"
                      aria-labelledby="display-fieldset-legend display-fieldset-messages"
                    >
                      <legend
                        className="fr-fieldset__legend--regular fr-fieldset__legend"
                        id="display-fieldset-legend"
                      >
                        {" "}
                        Choisissez un thème pour personnaliser l’apparence du site.{" "}
                      </legend>
                      <div className="fr-fieldset__element">
                        <div className="fr-radio-group fr-radio-rich">
                          <input
                            value="light"
                            type="radio"
                            id="fr-radios-theme-light"
                            name="fr-radios-theme"
                          />
                          <label className="fr-label" htmlFor="fr-radios-theme-light">
                            {" "}
                            Thème clair{" "}
                          </label>
                          <div className="fr-radio-rich__pictogram">
                            <svg
                              aria-hidden="true"
                              className="fr-artwork"
                              viewBox="0 0 80 80"
                              width="80px"
                              height="80px"
                            >
                              <use
                                className="fr-artwork-decorative"
                                href="/illustrations/sun.svg#artwork-decorative"
                              ></use>
                              <use
                                className="fr-artwork-minor"
                                href="/illustrations/sun.svg#artwork-minor"
                              ></use>
                              <use
                                className="fr-artwork-major"
                                href="/illustrations/sun.svg#artwork-major"
                              ></use>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="fr-fieldset__element">
                        <div className="fr-radio-group fr-radio-rich">
                          <input
                            value="dark"
                            type="radio"
                            id="fr-radios-theme-dark"
                            name="fr-radios-theme"
                          />
                          <label className="fr-label" htmlFor="fr-radios-theme-dark">
                            {" "}
                            Thème sombre{" "}
                          </label>
                          <div className="fr-radio-rich__pictogram">
                            <svg
                              aria-hidden="true"
                              className="fr-artwork"
                              viewBox="0 0 80 80"
                              width="80px"
                              height="80px"
                            >
                              <use
                                className="fr-artwork-decorative"
                                href="/illustrations/moon.svg#artwork-decorative"
                              ></use>
                              <use
                                className="fr-artwork-minor"
                                href="/illustrations/moon.svg#artwork-minor"
                              ></use>
                              <use
                                className="fr-artwork-major"
                                href="/illustrations/moon.svg#artwork-major"
                              ></use>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="fr-fieldset__element">
                        <div className="fr-radio-group fr-radio-rich">
                          <input
                            value="system"
                            type="radio"
                            id="fr-radios-theme-system"
                            name="fr-radios-theme"
                          />
                          <label className="fr-label" htmlFor="fr-radios-theme-system">
                            {" "}
                            Système{" "}
                            <span className="fr-hint-text">Utilise les paramètres système</span>
                          </label>
                          <div className="fr-radio-rich__pictogram">
                            <svg
                              aria-hidden="true"
                              className="fr-artwork"
                              viewBox="0 0 80 80"
                              width="80px"
                              height="80px"
                            >
                              <use
                                className="fr-artwork-decorative"
                                href="/illustrations/system.svg#artwork-decorative"
                              ></use>
                              <use
                                className="fr-artwork-minor"
                                href="/illustrations/system.svg#artwork-minor"
                              ></use>
                              <use
                                className="fr-artwork-major"
                                href="/illustrations/system.svg#artwork-major"
                              ></use>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div
                        className="fr-messages-group"
                        id="display-fieldset-messages"
                        aria-live="polite"
                      ></div>
                    </fieldset>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
