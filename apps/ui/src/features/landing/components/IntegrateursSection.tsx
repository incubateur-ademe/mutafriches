export function IntegrateursSection() {
  return (
    <section className="fr-py-8w">
      <style>{`
        .integrateurs-logos {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8rem;
        }
        .integrateurs-logos .logo-benefriches { height: 100px; }
        .integrateurs-logos .logo-urbanvitaliz { height: 60px; }
        @media (max-width: 767px) {
          .integrateurs-logos { gap: 3rem; }
          .integrateurs-logos .logo-benefriches { height: 60px; }
          .integrateurs-logos .logo-urbanvitaliz { height: 35px; }
        }
      `}</style>
      <div className="fr-container">
        <h2 className="fr-mb-4w">Ils sont déjà intégrateurs</h2>

        <div className="integrateurs-logos">
          <img
            src="/images/logo-benefriches.png"
            alt="Bénéfriches"
            className="logo-benefriches"
            loading="lazy"
          />
          <img
            src="/images/logo-urbanvitaliz.png"
            alt="UrbanVitaliz"
            className="logo-urbanvitaliz"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
