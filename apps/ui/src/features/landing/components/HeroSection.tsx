import { Link } from "react-router-dom";
import { ROUTES } from "../../../shared/config/routes.config";

export function HeroSection() {
  return (
    <section className="hero-section">
      <div className="fr-container">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
          <div className="fr-col-12 fr-col-md-7">
            <h1>Identifier les usages les plus adaptés pour un site</h1>

            <p className="fr-text--lead fr-mb-3w">
              Mutafriches est un outil d&apos;aide à la décision conçu pour aider les collectivités
              et les acteurs de l&apos;aménagement à qualifier un site et à y projeter les usages
              les plus adaptés compte tenu de ses caractéristiques et de son environnement.
            </p>

            <p className="hero-counter">Plus de 450 sites déjà évalués !</p>

            <div>
              <Link to={ROUTES.ANALYSER} className="fr-btn fr-btn--lg">
                Analyser mon site
              </Link>
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-5">
            <div className="hero-banner-wrapper">
              <img
                src="/illustrations/landing/usage-banner.png"
                alt="Aperçu des cartes d'usages : habitat, espace renaturé, équipement culturel, équipement public, industrie, photovoltaïque"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
