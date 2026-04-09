import { Link } from "react-router-dom";
import { ROUTES } from "../../../shared/config/routes.config";

export function CommentCaMarcheSection() {
  return (
    <section className="fr-py-8w">
      <div className="fr-container">
        <h2 className="fr-mb-4w">Comment ça marche ?</h2>

        {/* Bloc 1 : Qualification */}
        <div className="landing-card fr-mb-4w">
          <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
            <div className="fr-col-12 fr-col-md-7">
              <h1
                className="fr-mb-2w"
                style={{ color: "var(--text-action-high-blue-france, #000091)" }}
              >
                1
              </h1>
              <h4>Une qualification semi-automatisée de votre site</h4>
              <p className="fr-mb-2w">
                Une fois la ou les parcelles de votre site sélectionnées, Mutafriches source plus de{" "}
                <strong>16 critères déterminants</strong> issus des bases de données ouvertes
                nationales.
              </p>
              <p>
                Pour fiabiliser l&apos;analyse, l&apos;utilisateur peut{" "}
                <strong>renseigner des critères plus subjectifs</strong> (qualité du paysage par
                ex.) et ne relevant pas de la donnée ouverte (type de propriétaire par ex.).
              </p>
            </div>
            <div className="fr-col-12 fr-col-md-5">
              <div className="rounded-lg overflow-hidden">
                <img
                  src="/illustrations/landing/commentcamarche-1.png"
                  alt="Capture d'écran de l'étape de qualification"
                  className="fr-responsive-img"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bloc 2 : Évaluation — en mobile, le visuel passe avant le CTA */}
        <div className="landing-card">
          <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
            <div className="fr-col-12 fr-col-md-7">
              <h1
                className="fr-mb-2w"
                style={{ color: "var(--text-action-high-blue-france, #000091)" }}
              >
                2
              </h1>
              <h4>Une évaluation de la mutabilité du site sur 7 usages</h4>
              <p>
                Sur la base de la qualification semi-automatisée du site, une{" "}
                <strong>analyse de mutabilité</strong> permet de classer 7 usages de reconversion
                selon leur compatibilité avec votre site.
              </p>
            </div>
            <div className="fr-col-12 fr-col-md-5 ccm-block2-visual">
              <div className="rounded-lg overflow-hidden">
                <img
                  src="/illustrations/landing/commentcamarche-2.png"
                  alt="Capture d'écran des résultats d'analyse"
                  className="fr-responsive-img"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="fr-col-12 fr-col-md-7 ccm-block2-cta">
              <Link to={ROUTES.ANALYSER} className="fr-btn">
                Démarrer une analyse
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
