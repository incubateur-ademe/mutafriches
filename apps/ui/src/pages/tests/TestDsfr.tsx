import { Layout } from "../../layouts";
import { Link } from "react-router-dom";
import { useState } from "react";

export function TestDsfr() {
  const [alertVisible, setAlertVisible] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [selectedRadio, setSelectedRadio] = useState("");

  return (
    <Layout>
      <div className="fr-container">
        <div className="fr-my-6w">
          {/* En-tête */}
          <div className="fr-mb-6w">
            <nav role="navigation" className="fr-breadcrumb" aria-label="vous êtes ici :">
              <button
                type="button"
                className="fr-breadcrumb__button"
                aria-expanded="false"
                aria-controls="breadcrumb-test"
              >
                Voir le Fil d'Ariane
              </button>
              <div className="fr-collapse" id="breadcrumb-test">
                <ol className="fr-breadcrumb__list">
                  <li>
                    <Link className="fr-breadcrumb__link" to="/">
                      Accueil
                    </Link>
                  </li>
                  <li>
                    <Link className="fr-breadcrumb__link" to="/tests">
                      Tests
                    </Link>
                  </li>
                  <li>
                    <a className="fr-breadcrumb__link" aria-current="page">
                      Test DSFR
                    </a>
                  </li>
                </ol>
              </div>
            </nav>

            <h1>Test des composants DSFR</h1>
            <p className="fr-text--lead">
              Cette page permet de vérifier que les composants du Design System de l'État sont
              correctement chargés et fonctionnels.
            </p>
          </div>

          {/* Alerte */}
          {alertVisible && (
            <div className="fr-alert fr-alert--success fr-mb-4w">
              <h3 className="fr-alert__title">DSFR chargé avec succès</h3>
              <p>
                Les styles et composants du Design System de l'État sont correctement appliqués.
              </p>
              <button
                className="fr-btn--close fr-btn"
                title="Masquer le message"
                onClick={() => setAlertVisible(false)}
              >
                Masquer le message
              </button>
            </div>
          )}

          {/* Grille de test des composants */}
          <div className="fr-grid-row fr-grid-row--gutters">
            {/* Colonne 1 */}
            <div className="fr-col-12 fr-col-md-6">
              {/* Boutons */}
              <div className="fr-mb-4w">
                <h2 className="fr-h6">Boutons</h2>
                <div className="fr-btns-group fr-btns-group--inline">
                  <button className="fr-btn">Primaire</button>
                  <button className="fr-btn fr-btn--secondary">Secondaire</button>
                  <button className="fr-btn fr-btn--tertiary">Tertiaire</button>
                </div>
              </div>

              {/* Champs de saisie */}
              <div className="fr-mb-4w">
                <h2 className="fr-h6">Champ de saisie</h2>
                <div className="fr-input-group">
                  <label className="fr-label" htmlFor="test-input">
                    Libellé du champ
                  </label>
                  <input
                    className="fr-input"
                    type="text"
                    id="test-input"
                    name="test-input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Saisir du texte..."
                  />
                </div>
              </div>

              {/* Boutons radio */}
              <div className="fr-mb-4w">
                <h2 className="fr-h6">Boutons radio</h2>
                <fieldset className="fr-fieldset">
                  <legend className="fr-fieldset__legend fr-text--regular">Choix d'option</legend>
                  <div className="fr-fieldset__content">
                    <div className="fr-radio-group">
                      <input
                        type="radio"
                        id="radio-1"
                        name="test-radio"
                        value="option1"
                        checked={selectedRadio === "option1"}
                        onChange={(e) => setSelectedRadio(e.target.value)}
                      />
                      <label className="fr-label" htmlFor="radio-1">
                        Option 1
                      </label>
                    </div>
                    <div className="fr-radio-group">
                      <input
                        type="radio"
                        id="radio-2"
                        name="test-radio"
                        value="option2"
                        checked={selectedRadio === "option2"}
                        onChange={(e) => setSelectedRadio(e.target.value)}
                      />
                      <label className="fr-label" htmlFor="radio-2">
                        Option 2
                      </label>
                    </div>
                  </div>
                </fieldset>
              </div>
            </div>

            {/* Colonne 2 */}
            <div className="fr-col-12 fr-col-md-6">
              {/* Carte */}
              <div className="fr-mb-4w">
                <h2 className="fr-h6">Carte</h2>
                <div className="fr-card">
                  <div className="fr-card__body">
                    <div className="fr-card__content">
                      <h3 className="fr-card__title">Titre de la carte</h3>
                      <p className="fr-card__desc">
                        Description de la carte de test pour vérifier l'affichage.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Badge */}
              <div className="fr-mb-4w">
                <h2 className="fr-h6">Badges</h2>
                <div className="fr-badges-group">
                  <p className="fr-badge fr-badge--success">Succès</p>
                  <p className="fr-badge fr-badge--info">Information</p>
                  <p className="fr-badge fr-badge--warning">Attention</p>
                </div>
              </div>

              {/* Mise en avant */}
              <div className="fr-mb-4w">
                <h2 className="fr-h6">Mise en avant</h2>
                <div className="fr-callout">
                  <h3 className="fr-callout__title">Information importante</h3>
                  <p className="fr-callout__text">
                    Ceci est un callout de test pour vérifier l'affichage des mises en avant.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
