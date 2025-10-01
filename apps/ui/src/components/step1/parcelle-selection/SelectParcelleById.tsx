import React, { useState } from "react";

interface SelectParcelleByIdProps {
  onSearch: (identifiant: string) => void;
}

export const SelectParcelleById: React.FC<SelectParcelleByIdProps> = ({ onSearch }) => {
  const [parcelId, setParcelId] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
    const limited = cleaned.slice(0, 17);

    let formatted = "";
    let pos = 0;

    let deptCommune = limited.slice(0, 6);
    if (limited.length >= 6 && /^97[1-6]/.test(limited)) {
      deptCommune = limited.slice(0, 6);
      pos = 6;
    } else if (limited.length >= 5 && /^2[AB]/.test(limited)) {
      deptCommune = limited.slice(0, 5);
      pos = 5;
    } else if (limited.length >= 5) {
      deptCommune = limited.slice(0, 5);
      pos = 5;
    } else {
      formatted = limited;
      setParcelId(formatted);
      return;
    }

    formatted = deptCommune;

    if (limited.length <= pos) {
      setParcelId(formatted);
      return;
    }

    const reste = limited.slice(pos);
    let prefixeSection = "";
    let numeroStart = -1;

    for (let i = reste.length - 4; i >= 0; i--) {
      if (/^[0-9]{4}$/.test(reste.slice(i, i + 4))) {
        numeroStart = i;
        break;
      }
    }

    if (numeroStart > 0) {
      prefixeSection = reste.slice(0, numeroStart);
      formatted += " " + prefixeSection.slice(0, 3);
      if (prefixeSection.length > 3) {
        formatted += " " + prefixeSection.slice(3);
      }
      formatted += " " + reste.slice(numeroStart, numeroStart + 4);
    } else {
      if (reste.length > 0) {
        formatted += " " + reste.slice(0, 3);
      }
      if (reste.length > 3) {
        formatted += " " + reste.slice(3, 5);
      }
      if (reste.length > 5) {
        formatted += " " + reste.slice(5);
      }
    }

    setParcelId(formatted);
  };

  const handleSearch = () => {
    const cleanId = parcelId.replace(/\s/g, "");
    onSearch(cleanId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div>
      <p className="fr-text--sm">
        Saisissez l&apos;identifiant ou les identifiants des parcelles à analyser
      </p>

      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <div className="fr-input-group">
            <label className="fr-label" htmlFor="parcel-id">
              Identifiant de parcelle
              <span className="fr-hint-text">
                Format : code département + code commune + préfixe + section + numéro
              </span>
            </label>
            <input
              className="fr-input"
              type="text"
              id="parcel-id"
              name="parcel-id"
              placeholder="Ex: 25056 000 IK 0102"
              value={parcelId}
              onChange={handleInputChange}
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
        <h3 className="fr-callout__title">
          Comment trouver l&apos;identifiant de votre parcelle ?
        </h3>

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
            <h4 className="fr-h6">Guide pour obtenir l&apos;identifiant sur le Géoportail</h4>

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
                <strong>Activez la couche &quot;Parcelles cadastrales&quot;</strong>
                <br />
                <span className="fr-text--sm fr-text--regular">
                  Cliquez sur l&apos;icône &quot;Cartes&quot; dans le menu de gauche
                  <br />
                  Dans la section &quot;Foncier, cadastre, urbanisme&quot;
                  <br />
                  Cochez &quot;Parcelles cadastrales&quot;
                </span>
              </li>

              <li className="fr-mb-2w">
                <strong>Naviguez jusqu&apos;à votre parcelle</strong>
                <br />
                <span className="fr-text--sm fr-text--regular">
                  Utilisez la barre de recherche pour entrer une adresse
                  <br />
                  Ou naviguez manuellement et zoomez sur la zone souhaitée
                </span>
              </li>

              <li className="fr-mb-2w">
                <strong>Cliquez sur la parcelle</strong>
                <br />
                <span className="fr-text--sm fr-text--regular">
                  Une bulle d&apos;information apparaît avec l&apos;identifiant complet
                </span>
              </li>

              <li>
                <strong>Copiez l&apos;identifiant</strong>
                <br />
                <span className="fr-text--sm fr-text--regular">
                  Exemples de formats :
                  <br />
                  <code>25056000IK0102</code> (Métropole : 5 + 3 + 2 + 4)
                  <br />
                  <code>972090000O0498</code> (DOM-TOM : 6 + 3 + 1 + 4)
                  <br />
                  <code>2A004000AC0045</code> (Corse : 5 + 3 + 2 + 4)
                </span>
              </li>
            </ol>

            <div className="fr-notice fr-notice--info fr-mt-3w">
              <div className="fr-container">
                <div className="fr-notice__body">
                  <p className="fr-notice__title">
                    Astuce : Sur le Géoportail, les parcelles apparaissent en orange quand vous
                    zoomez suffisamment sur la carte.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="fr-callout__text fr-mb-2w">
          L&apos;identifiant de parcelle peut être trouvé sur le cadastre, les documents officiels
          de propriété (acte notarié, taxe foncière) ou directement sur la carte interactive du
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
