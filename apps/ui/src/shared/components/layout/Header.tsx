import { Link } from "react-router-dom";
import { ROUTES } from "../../config/routes.config";

export function Header() {
  return (
    <header role="banner" className="fr-header" id="header">
      <div className="fr-header__body">
        <div className="fr-container">
          <div className="fr-header__body-row">
            <div className="fr-header__brand fr-enlarge-link">
              <div className="fr-header__brand-top">
                <div className="fr-header__logo">
                  <p className="fr-logo">
                    Republique
                    <br />
                    Francaise
                  </p>
                </div>
                <div className="fr-header__operator">
                  <img
                    src="/images/logo-ademe.svg"
                    alt="ADEME"
                    className="fr-responsive-img"
                    style={{ maxHeight: "5rem" }}
                  />
                </div>
                <div className="fr-header__navbar">
                  <button
                    data-fr-opened="false"
                    aria-controls="header-modal"
                    title="Menu"
                    type="button"
                    id="header-menu-btn"
                    className="fr-btn--menu fr-btn"
                  >
                    Menu
                  </button>
                </div>
              </div>
              <div className="fr-header__service">
                <a href="/" title="Retour a l'accueil du site - Mutafriches - Republique Francaise">
                  <p className="fr-header__service-title">
                    Mutafriches{" "}
                    <span className="fr-badge fr-badge--success fr-badge--no-icon">BETA</span>
                  </p>
                </a>
                <p className="fr-header__service-tagline">
                  Le meilleur usage pour votre site en friche
                </p>
              </div>
            </div>
            <div className="fr-header__tools">
              <div className="fr-header__tools-links">
                <ul className="fr-btns-group">
                  <li>
                    <Link
                      to={ROUTES.DOCUMENTATION_INTEGRATION}
                      className="fr-btn fr-btn--tertiary fr-icon-book-2-fill fr-btn--icon-left"
                    >
                      Documentation
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal menu mobile - requis par le DSFR */}
      <div className="fr-header__menu fr-modal" id="header-modal" aria-labelledby="header-menu-btn">
        <div className="fr-container">
          <button
            aria-controls="header-modal"
            title="Fermer"
            type="button"
            className="fr-btn--close fr-btn"
          >
            Fermer
          </button>
          <div className="fr-header__menu-links">
            <ul className="fr-btns-group">
              <li>
                <Link to={ROUTES.DOCUMENTATION_INTEGRATION} className="fr-btn">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
