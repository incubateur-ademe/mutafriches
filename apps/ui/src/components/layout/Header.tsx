import { ThemeModal } from "./ThemeModal";

export function Header() {
  return (
    <>
      {/* Bouton paramètres d'affichage */}
      <div className="fr-grid-row fr-grid-row--right fr-mb-4w">
        <div className="fr-col-auto">
          <button
            aria-controls="fr-theme-modal"
            data-fr-opened="false"
            title="Paramètres d'affichage"
            type="button"
            className="fr-btn fr-btn--tertiary fr-btn--sm"
          >
            Paramètres d'affichage
          </button>
        </div>
      </div>

      {/* Titre et logo */}
      <div className="fr-grid-row fr-grid-row--middle fr-mb-2w">
        <div className="fr-col">
          <h1>Mutafriches</h1>
        </div>
        <div className="fr-col-auto">
          <img
            src="/images/logo-ademe.svg"
            alt="Logo ADEME"
            className="fr-responsive-img"
            style={{ maxHeight: "6rem" }}
          />
        </div>
      </div>

      <p>Trouvez le meilleur usage pour votre site en friche</p>
      <hr />

      {/* Modal des paramètres d'affichage */}
      <ThemeModal />
    </>
  );
}
