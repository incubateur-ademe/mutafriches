import React, { useState } from "react";

interface SelectParcelleByIdProps {
  onSearch: (identifiant: string) => void;
}

export const SelectParcelleById: React.FC<SelectParcelleByIdProps> = ({ onSearch }) => {
  const [parcelId, setParcelId] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  const handleSearch = () => {
    onSearch(parcelId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div>
      <p className="fr-text--sm">
        Saisissez l'identifiant ou les identifiants des parcelles à analyser
      </p>

      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <div className="fr-input-group">
            <label className="fr-label" htmlFor="parcel-id">
              Identifiant de parcelle
              <span className="fr-hint-text">
                Format : code département + code commune + section + numéro
              </span>
            </label>
            <input
              className="fr-input"
              type="text"
              id="parcel-id"
              name="parcel-id"
              placeholder="Ex: 50147000AR0010"
              value={parcelId}
              onChange={(e) => setParcelId(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>
        <div className="fr-col-12 fr-col-md-6" style={{ display: "flex", alignItems: "end" }}>
          <button
            className="fr-btn fr-btn--icon-left fr-icon-search-line"
            type="button"
            onClick={handleSearch}
          >
            Rechercher la parcelle
          </button>
        </div>
      </div>

      <div className="fr-callout fr-mt-8w">
        <h3 className="fr-callout__title">Comment trouver l'identifiant de votre parcelle ?</h3>

        <div className="fr-mb-3w">
          <button
            className="fr-btn fr-btn--tertiary-no-outline fr-btn--icon-left"
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            aria-expanded={showGuide}
            style={{ paddingLeft: 0 }}
          >
            <span className={showGuide ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"} />
            {showGuide ? "Masquer" : "Afficher"} le guide étape par étape
          </button>
        </div>

        {showGuide && (
          <div className="fr-background-alt--grey fr-p-3w fr-mb-3w" style={{ borderRadius: "4px" }}>
            <h4 className="fr-h6">📍 Guide pour obtenir l'identifiant sur le Géoportail</h4>

            <ol className="fr-mt-2w">
              <li className="fr-mb-2w">
                <strong>Accédez au Géoportail</strong>
                <br />
                Cliquez sur le bouton ci-dessous ou rendez-vous sur{" "}
                <a
                  href="https://www.geoportail.gouv.fr/carte"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  geoportail.gouv.fr/carte
                </a>
              </li>

              <li className="fr-mb-2w">
                <strong>Activez la couche "Parcelles cadastrales"</strong>
                <br />
                <span className="fr-text--sm fr-text--regular">
                  • Cliquez sur l'icône "Cartes" dans le menu de gauche
                  <br />
                  • Dans la section "Foncier, cadastre, urbanisme"
                  <br />• Cochez "Parcelles cadastrales"
                </span>
              </li>

              <li className="fr-mb-2w">
                <strong>Naviguez jusqu'à votre parcelle</strong>
                <br />
                <span className="fr-text--sm fr-text--regular">
                  • Utilisez la barre de recherche pour entrer une adresse
                  <br />• Ou naviguez manuellement et zoomez sur la zone souhaitée
                </span>
              </li>

              <li className="fr-mb-2w">
                <strong>Cliquez sur la parcelle</strong>
                <br />
                <span className="fr-text--sm fr-text--regular">
                  Une bulle d'information apparaît avec l'identifiant complet
                </span>
              </li>

              <li>
                <strong>Copiez l'identifiant</strong>
                <br />
                <span className="fr-text--sm fr-text--regular">
                  Il apparaît sous la forme : <code>50147000AR0010</code>
                  <br />• <strong>50</strong> : département (Manche)
                  <br />• <strong>147</strong> : commune
                  <br />• <strong>000AR</strong> : préfixe + section
                  <br />• <strong>0010</strong> : numéro de parcelle
                </span>
              </li>
            </ol>

            <div className="fr-notice fr-notice--info fr-mt-3w">
              <div className="fr-container">
                <div className="fr-notice__body">
                  <p className="fr-notice__title">
                    💡 Astuce : Sur le Géoportail, les parcelles apparaissent en orange quand vous
                    zoomez suffisamment sur la carte.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="fr-callout__text fr-mb-2w">
          L'identifiant de parcelle peut être trouvé sur le cadastre, les documents officiels de
          propriété (acte notarié, taxe foncière) ou directement sur la carte interactive du
          Géoportail.
        </p>

        <a
          href="https://www.geoportail.gouv.fr/carte"
          target="_blank"
          rel="noopener noreferrer"
          className="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-map-pin-2-line"
        >
          Ouvrir la carte du Géoportail
        </a>

        <div className="fr-mt-2w">
          <a
            href="https://www.cadastre.gouv.fr/"
            target="_blank"
            rel="noopener noreferrer"
            className="fr-link fr-link--sm"
          >
            Ou consultez le site du cadastre (cadastre.gouv.fr)
          </a>
        </div>
      </div>
    </div>
  );
};
