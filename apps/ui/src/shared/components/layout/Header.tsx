import { Link } from "react-router-dom";
import { ROUTES } from "../../config/routes.config";

export function Header() {
  return (
    <header role="banner" className="fr-header" id="header-3">
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
                    alt="ADEME - Agence de la transition ecologique"
                    className="fr-responsive-img"
                    style={{ maxHeight: "5rem" }}
                  />
                </div>
                <div className="fr-header__navbar">
                  <button
                    data-fr-opened="false"
                    aria-controls="menu-modal-5"
                    title="Menu"
                    type="button"
                    id="menu-4"
                    className="fr-btn--menu fr-btn"
                  >
                    Menu
                  </button>
                </div>
              </div>
              <div className="fr-header__service">
                <a
                  href="/"
                  title={`Retour a l'accueil du site - Mutafriches - Republique Francaise`}
                >
                  <span className="flex flex-row items-center">
                    <p className="fr-header__service-title fr-mr-1w">Mutafriches</p>
                    <p className="fr-badge fr-badge--success fr-badge--no-icon">BETA</p>
                  </span>
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
                      className="fr-btn fr-icon-book-2-line fr-btn--icon-left"
                      title="API & Documentation Intégrateurs"
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
    </header>
  );
}
