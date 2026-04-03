export function MutabiliteSection() {
  return (
    <section className="fr-py-8w">
      <div className="fr-container">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
          <div className="fr-col-12 fr-col-md-6">
            <img
              src="/illustrations/landing/questceque-mutabilite.png"
              alt="Vue aérienne d'une friche avec des panneaux solaires"
              className="fr-responsive-img rounded-lg"
              loading="lazy"
            />
          </div>

          <div className="fr-col-12 fr-col-md-6">
            <h2>Qu&apos;est-ce que la mutabilité ?</h2>

            <p>
              <strong>
                La mutabilité d&apos;un site correspond à sa capacité à changer d&apos;usage.
              </strong>{" "}
              Elle permet d&apos;estimer le potentiel de reconversion du site vers différents usages
              comme le logement, les équipements publics, les activités tertiaires,
              l&apos;industrie, de photovoltaïque ou encore la renaturation.
            </p>

            <p>
              Avec Mutafriches, les collectivités locales disposent d&apos;
              <strong>
                un outil d&apos;aide à la décision pour objectiver l&apos;analyse d&apos;un site
              </strong>
              , et comparer plusieurs usages possibles. C&apos;est{" "}
              <strong>un premier pas, vers la définition d&apos;une stratégie territoriale.</strong>
            </p>

            <p>
              Dans un <strong>contexte de sobriété foncière</strong>, cet enjeu est central : la
              France consomme encore environ 20 000 hectares d&apos;espaces naturels, agricoles et
              forestiers par an, alors que le stock de friches est aujourd&apos;hui estimé à 140 000
              hectares.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
