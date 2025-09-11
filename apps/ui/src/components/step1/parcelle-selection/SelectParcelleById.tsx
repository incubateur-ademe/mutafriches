import React, { useState } from "react";

interface SelectParcelleByIdProps {
  onSearch: (identifiant: string) => void;
}

export const SelectParcelleById: React.FC<SelectParcelleByIdProps> = ({ onSearch }) => {
  const [parcelId, setParcelId] = useState("");

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

      <div className="fr-callout fr-callout--green-emeraude fr-mt-2w">
        <p className="fr-callout__text">
          L'Identifiant de parcelle peut être trouvé sur le cadastre ou les documents officiels de
          la propriété.
        </p>
        <a
          href="https://www.cadastre.gouv.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="fr-btn fr-btn--secondary fr-btn--icon-left"
        >
          Consulter le cadastre
        </a>
      </div>

      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <div className="fr-input-group">
            <label className="fr-label" htmlFor="parcel-id">
              Identifiant de parcelle
              <span className="fr-hint-text">
                Saisissez l'identifiant de la parcelle à analyser
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
    </div>
  );
};
