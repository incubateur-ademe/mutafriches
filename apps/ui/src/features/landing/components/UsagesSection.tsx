import { Link } from "react-router-dom";
import { ROUTES } from "../../../shared/config/routes.config";

export function UsagesSection() {
  /* Ordre : Excellent → Très bon → Bon (progression décroissante) */
  const cards = [
    { src: "/illustrations/landing/usages/usage-public.png", alt: "Équipement public" },

    {
      src: "/illustrations/landing/usages/usage-habitat.png",
      alt: "Habitat & commerce de proximité",
    },
    { src: "/illustrations/landing/usages/usage-renature.png", alt: "Espace renaturé" },
    {
      src: "/illustrations/landing/usages/usage-locaux-activite.png",
      alt: "Local d'activité",
    },
    { src: "/illustrations/landing/usages/usage-industrie.png", alt: "Industrie" },
    {
      src: "/illustrations/landing/usages/usages-culturel.png",
      alt: "Équipement culturel & touristique",
    },
  ];

  return (
    <section className="fr-py-8w" style={{ backgroundColor: "#f1f7ff" }}>
      <style>{`
        .usages-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .usages-legende-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .usages-legende { width: 100%; }
        .usages-legende-cta {
          /* Centre de la carte dans l'image (32 % de sa largeur), les flèches transparentes le décalant du centre */
          padding-left: 32.4%;
        }
        .usages-legende-cta .fr-btn { transform: translateX(-50%); }
        @media (max-width: 1023px) {
          .usages-grid { grid-template-columns: repeat(2, 1fr); }
          .usages-hide-mobile { display: none; }
          .usages-legende-col { padding-left: 10rem; }
          .usages-legende { max-width: 60%; }
        }
      `}</style>
      <div className="fr-container">
        <h2 className="fr-mb-4w">Les 7 usages proposés</h2>

        <div className="fr-grid-row fr-grid-row--gutters">
          {/* Image explicative à gauche */}
          <div className="fr-col-12 fr-col-lg-5 usages-legende-col">
            <div className="usages-legende">
              <img
                src="/illustrations/landing/usage-ellipses.png"
                alt="Légende des cartes d'usages : appréciation de la compatibilité, usage proposé, critères déterminants"
                className="fr-responsive-img"
                loading="lazy"
              />
              <div className="usages-legende-cta fr-mt-4w">
                <Link to={ROUTES.ANALYSER} className="fr-btn">
                  Tester sur un site
                </Link>
              </div>
            </div>
          </div>

          {/* Grille des 6 cartes */}
          <div className="fr-col-12 fr-col-lg-7">
            <div className="usages-grid">
              {cards.map((card, index) => (
                <img
                  key={card.alt}
                  src={card.src}
                  alt={card.alt}
                  className={`fr-responsive-img${index >= 4 ? " usages-hide-mobile" : ""}`}
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
