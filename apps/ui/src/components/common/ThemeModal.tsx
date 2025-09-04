export function ThemeModal() {
  return (
    <dialog aria-labelledby="fr-theme-modal-title" id="fr-theme-modal" className="fr-modal">
      <div className="fr-container fr-container--fluid fr-container-md">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-6 fr-col-lg-4">
            <div className="fr-modal__body">
              <div className="fr-modal__header">
                <button
                  className="fr-btn--close fr-btn"
                  aria-controls="fr-theme-modal"
                  title="Fermer"
                  type="button"
                >
                  Fermer
                </button>
              </div>
              <div className="fr-modal__content">
                <h1 id="fr-theme-modal-title" className="fr-modal__title">
                  Paramètres d'affichage
                </h1>
                <div className="fr-display">
                  <fieldset className="fr-fieldset">
                    <legend className="fr-fieldset__legend fr-text--regular">
                      Choisissez un thème pour personnaliser l'apparence du site.
                    </legend>
                    <div className="fr-fieldset__content">
                      <div className="fr-radio-group">
                        <input
                          type="radio"
                          id="fr-radios-theme-light"
                          name="fr-radios-theme"
                          value="light"
                        />
                        <label className="fr-label" htmlFor="fr-radios-theme-light">
                          Thème clair
                        </label>
                      </div>
                      <div className="fr-radio-group">
                        <input
                          type="radio"
                          id="fr-radios-theme-dark"
                          name="fr-radios-theme"
                          value="dark"
                        />
                        <label className="fr-label" htmlFor="fr-radios-theme-dark">
                          Thème sombre
                        </label>
                      </div>
                      <div className="fr-radio-group">
                        <input
                          type="radio"
                          id="fr-radios-theme-system"
                          name="fr-radios-theme"
                          value="system"
                          defaultChecked
                        />
                        <label className="fr-label" htmlFor="fr-radios-theme-system">
                          Système
                          <span className="fr-hint-text">
                            Utilise les préférences de votre navigateur
                          </span>
                        </label>
                      </div>
                    </div>
                  </fieldset>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
