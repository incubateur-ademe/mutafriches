import { Link } from "react-router-dom";
import { ROUTES } from "../../../shared/config/routes.config";

export function IntegrationSection() {
  return (
    <section className="fr-py-8w">
      <div className="fr-container">
        <h2 className="fr-mb-2w">Intégrer Mutafriches dans vos outils</h2>

        <div style={{ padding: "2.5rem", backgroundColor: "#f1f7ff", borderRadius: "24px" }}>
          <p className="fr-text--lead fr-mb-4w">
            Vous développez un outil ou une plateforme sur les enjeux fonciers ?
            <br />
            Vous portez une démarche d&apos;inventaire des friches ?
          </p>

          <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--top">
            <div className="fr-col-12 fr-col-md-7">
              <img
                src="/illustrations/landing/integrer-mutafriches.png"
                alt="Capture d'écran d'un SIG intégrant Mutafriches"
                className="fr-responsive-img"
                loading="lazy"
              />
            </div>

            <div className="fr-col-12 fr-col-md-5">
              <p>
                Mutafriches est avant tout{" "}
                <strong>
                  une brique technique conçue pour s&apos;intégrer dans vos outils existants.
                </strong>
              </p>

              <p className="fr-mb-2w">
                Le service peut être embarqué directement dans vos SIG, vos observatoires des
                friches ou vos plateformes métiers, afin d&apos;enrichir vos parcours d&apos;analyse
                et d&apos;aide à la décision. Selon vos besoins,{" "}
                <strong>Mutafriches est intégrable sous forme d&apos;iframe ou d&apos;API</strong>,
                pour une mise en oeuvre adaptée à votre environnement technique. Cette intégrabilité
                permet aux collectivités et à leurs partenaires de mobiliser l&apos;analyse de
                mutabilité sans changer d&apos;outils, tout en capitalisant sur leurs propres
                interfaces et usages.
              </p>

              <Link to={ROUTES.DOCUMENTATION_INTEGRATION} className="fr-btn">
                Accéder à la documentation
              </Link>
              <br />
              <a
                href="mailto:contact@mutafriches.beta.gouv.fr"
                className="fr-btn fr-mt-2w fr-btn--secondary"
              >
                Nous contacter
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
