export function UsagesSection() {
  /* Ordre : Excellent → Très bon → Bon (progression décroissante) */
  const cards = [
    {
      src: "/illustrations/landing/usages/usage-habitat.png",
      alt: "Habitat & commerce de proximité",
    },
    { src: "/illustrations/landing/usages/usage-renature.png", alt: "Espace renaturé" },
    { src: "/illustrations/landing/usages/usage-public.png", alt: "Équipement public" },
    {
      src: "/illustrations/landing/usages/usages-culturel.png",
      alt: "Équipement culturel & touristique",
    },
    { src: "/illustrations/landing/usages/usage-bureaux.png", alt: "Bureaux" },
    { src: "/illustrations/landing/usages/usage-industrie.png", alt: "Industrie" },
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
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 1023px) {
          .usages-grid { grid-template-columns: repeat(2, 1fr); }
          .usages-hide-mobile { display: none; }
          .usages-legende-col { padding-left: 10rem; }
          .usages-legende-img { max-width: 60%; display: block; }
        }
      `}</style>
      <div className="fr-container">
        <h2 className="fr-mb-4w">Les 7 usages proposés</h2>

        <div className="fr-grid-row fr-grid-row--gutters">
          {/* Image explicative à gauche */}
          <div className="fr-col-12 fr-col-lg-5 usages-legende-col">
            <img
              src="/illustrations/landing/usage-ellipses.png"
              alt="Légende des cartes d'usages : appréciation de la compatibilité, usage proposé, critères déterminants"
              className="fr-responsive-img usages-legende-img"
              loading="lazy"
            />
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
