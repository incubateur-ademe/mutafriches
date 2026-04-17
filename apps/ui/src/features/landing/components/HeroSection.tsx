import { Link } from "react-router-dom";
import { ROUTES } from "../../../shared/config/routes.config";

export function HeroSection() {
  return (
    <section style={{ padding: 0, backgroundColor: "#f1f7ff", overflow: "hidden" }}>
      <style>{`
        @media (max-width: 767px) {
          .hero-banner-wrapper { display: none; }
        }
      `}</style>
      <div className="fr-container max-md:py-8 md:py-12">
        <div className="fr-grid-row fr-grid-row--gutters fr-py-12v fr-grid-row--middle">
          <div className="fr-col-12 fr-col-md-7">
            <h1>Identifier les usages les plus adaptés pour un site</h1>

            <p className="fr-text--lead fr-mb-3w">
              Mutafriches est un outil d&apos;aide à la décision conçu pour aider les collectivités
              et les acteurs de l&apos;aménagement à qualifier un site et à y projeter les usages
              les plus adaptés compte tenu de ses caractéristiques et de son environnement.
            </p>

            <p className="inline-block text-xs font-bold tracking-wide uppercase text-[var(--text-mention-grey)] mb-6">
              <strong>Plus de 600 sites déjà évalués !</strong>
            </p>

            <div>
              <Link to={ROUTES.ANALYSER} className="fr-btn fr-btn--lg">
                Analyser mon site
              </Link>
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-5 py-0">
            <div
              className="hero-banner-wrapper"
              style={{
                overflow: "hidden",
                height: "100%",
                position: "relative",
                minHeight: "500px",
                margin: "-3rem 0",
              }}
            >
              <img
                src="/illustrations/landing/usage-banner.png"
                alt="Aperçu des cartes d'usages : habitat, espace renaturé, équipement culturel, équipement public, industrie, photovoltaïque"
                className="max-w-none absolute"
                style={{
                  width: "150%",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-65%, -50%)",
                }}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
