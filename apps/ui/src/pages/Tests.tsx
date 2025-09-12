import { Layout } from "../layouts";
import { Link } from "react-router-dom";

export function Tests() {
  const testPages = [
    {
      id: "test-iframe",
      title: "Test IFrame",
      description: "Tester l'intégration en IFrame et la communication entre l'iframe et le parent",
      href: "/test/iframe",
      image: "/illustrations/undraw_personal-site_z6pl.svg",
    },
    {
      id: "test-algorithme",
      title: "Test Algorithme",
      description: "Tester l'algorithme de calcul de mutabilité et les indices de fiabilité",
      href: "/test/algorithme",
      image: "/illustrations/undraw_file-search_cbur.svg",
    },
    {
      id: "test-dsfr",
      title: "Test DSFR",
      description: "Vérifier que le Design System de l'État est bien chargé et fonctionnel",
      href: "/test/dsfr",
      image: "/illustrations/undraw_design-components_529l.svg",
    },
    {
      id: "test-enrichissement",
      title: "Test Enrichissement",
      description: "Tester l'API d'enrichissement des parcelles et la récupération des données",
      href: "/test/enrichissement-parcelle",
      image: "/illustrations/undraw_map-dark_g9xq.svg",
    },
  ];

  return (
    <Layout>
      <div className="fr-container">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center">
          <div className="content-editorial fr-col-12">
            <nav role="navigation" className="fr-breadcrumb" aria-label="vous êtes ici :">
              <button
                type="button"
                className="fr-breadcrumb__button"
                aria-expanded="false"
                aria-controls="breadcrumb"
              >
                Voir le Fil d'Ariane
              </button>
              <div className="fr-collapse" id="breadcrumb">
                <ol className="fr-breadcrumb__list">
                  <li>
                    <Link className="fr-breadcrumb__link" to="/">
                      Accueil
                    </Link>
                  </li>
                  <li>
                    <a className="fr-breadcrumb__link" aria-current="page">
                      Tests
                    </a>
                  </li>
                </ol>
              </div>
            </nav>

            <h1 id="tests">Tests</h1>
            <p className="fr-text--lead fr-mb-6w">
              Pages de test pour vérifier le bon fonctionnement des différents composants de
              l'application Mutafriches.
            </p>

            <div className="fr-grid-row fr-grid-row--gutters fr-mb-12v">
              {testPages.map((test) => (
                <div key={test.id} className="fr-col-12 fr-col-sm-6 fr-col-lg-3">
                  <div className="fr-card fr-enlarge-link">
                    <div className="fr-card__body">
                      <div className="fr-card__content">
                        <h2 className="fr-card__title">
                          <Link to={test.href}>{test.title}</Link>
                        </h2>
                        <p className="fr-card__desc">{test.description}</p>
                      </div>
                    </div>
                    <div className="fr-card__header">
                      <div className="fr-card__img">
                        <img
                          alt="Test illustration"
                          src={test.image}
                          className="fr-responsive-img"
                          onError={(e) => {
                            // Image de fallback si l'image n'existe pas
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OTk5OSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNHB4Ij5UZXN0PC90ZXh0Pjwvc3ZnPg==";
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="fr-callout fr-callout--brown-cafe">
              <h3 className="fr-callout__title">Information</h3>
              <p className="fr-callout__text">
                Ces pages de test sont destinées au développement et à la validation. Elles
                permettent de vérifier le bon fonctionnement des différentes parties de
                l'application.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
