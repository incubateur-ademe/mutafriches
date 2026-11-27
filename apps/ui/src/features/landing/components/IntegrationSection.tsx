import { Link } from "react-router-dom";
import { ROUTES } from "../../../shared/config/routes.config";

export function IntegrationSection() {
  return (
    <section className="fr-py-8w" style={{ backgroundColor: "#f1f7ff" }}>
      <div className="fr-container">
        <h2 className="fr-mb-2w">Utiliser Mutafriches</h2>

        <p className="fr-text--lead fr-mb-4w">
          Vous développez un outil ou une plateforme sur les enjeux fonciers ?
          <br />
          Vous portez une démarche d&apos;inventaire des friches ?
        </p>

        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
          <div className="fr-col-12 fr-col-md-7">
            <img
              src="/illustrations/landing/utiliser-mutafriches.webp"
              alt="Extension QGIS Mutafriches : carte des sites et tableau de bord territorial"
              className="fr-responsive-img"
              loading="lazy"
            />
          </div>

          <div className="fr-col-12 fr-col-md-5">
            <p className="fr-mb-3w">
              Embarquez directement le service Mutafriches dans vos outils (SIG, observatoires,
              QGIS, etc.) ou sollicitez-nous pour la création d&apos;un espace dédié rapidement
              mobilisable.
            </p>

            <Link to={ROUTES.INTEGRER} className="fr-btn">
              Découvrir comment utiliser Mutafriches
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
