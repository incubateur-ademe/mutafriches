export function TestCallback() {
  return (
    <div className="fr-container fr-py-8w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12 fr-col-lg-10">
          {/* Titre principal */}
          <div className="fr-text--center fr-mb-4w">
            <h1 className="fr-h2">Callback réussi - page d'exemple</h1>
            <p className="fr-text--lg">Votre analyse de friche a été transmise avec succès</p>
          </div>

          {/* Image centrée et grande */}
          <div className="fr-mb-6w">
            <figure
              role="group"
              className="fr-content-media"
              aria-label="Illustration de confirmation"
            >
              <div className="fr-content-media__img">
                <img
                  className="fr-responsive-img"
                  src="/illustrations/undraw_order-confirmed_m9e9.svg"
                  alt="Confirmation de la transmission des données"
                />
              </div>
            </figure>
          </div>

          {/* Callout bleu écume */}
          <div className="fr-grid-row">
            <div className="fr-col-12 fr-col-md-8">
              <div className="fr-callout fr-callout--blue-ecume">
                <h3 className="fr-callout__title">Données reçues avec succès</h3>
                <p className="fr-callout__text">
                  Les informations de votre friche ont été correctement transmises et enregistrées.
                </p>
              </div>
            </div>
          </div>

          {/* Section d'informations additionnelles */}
          <div
            className="fr-mt-8w fr-pt-6w"
            style={{ borderTop: "1px solid var(--border-default-grey)" }}
          >
            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12 fr-col-md-4">
                <div className="fr-text--center">
                  <span
                    className="fr-icon-check-line fr-icon--lg"
                    aria-hidden="true"
                    style={{ color: "var(--text-default-success)" }}
                  ></span>
                  <h4 className="fr-h6 fr-mt-2w">Transmission réussie</h4>
                  <p className="fr-text--sm">Les données ont été envoyées à l'API Mutafriches</p>
                </div>
              </div>
              <div className="fr-col-12 fr-col-md-4">
                <div className="fr-text--center">
                  <span
                    className="fr-icon-time-line fr-icon--lg"
                    aria-hidden="true"
                    style={{ color: "var(--text-default-info)" }}
                  ></span>
                  <h4 className="fr-h6 fr-mt-2w">Traitement en cours</h4>
                  <p className="fr-text--sm">L'analyse sera disponible sous peu</p>
                </div>
              </div>
              <div className="fr-col-12 fr-col-md-4">
                <div className="fr-text--center">
                  <span
                    className="fr-icon-mail-line fr-icon--lg"
                    aria-hidden="true"
                    style={{ color: "var(--text-default-info)" }}
                  ></span>
                  <h4 className="fr-h6 fr-mt-2w">Notification</h4>
                  <p className="fr-text--sm">Vous recevrez un email de confirmation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
