export function IntegrateursSection() {
  return (
    <section className="fr-py-8w">
      <div className="fr-container">
        <h2 className="fr-mb-4w">Ils sont déjà intégrateurs</h2>

        <div className="flex items-center justify-center" style={{ gap: "6rem" }}>
          <img
            src="/images/logo-benefriches.png"
            alt="Bénéfriches"
            className="h-[100px]"
            loading="lazy"
          />
          <img
            src="/images/logo-urbanvitaliz.png"
            alt="UrbanVitaliz"
            className="h-[50px]"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
