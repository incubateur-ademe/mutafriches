interface MultiParcelleToggleProps {
  isMulti: boolean;
  onToggle: (isMulti: boolean) => void;
}

export function MultiParcelleToggle({ isMulti, onToggle }: MultiParcelleToggleProps) {
  const handleChange = (value: string) => {
    if (value === "2") {
      // Afficher le message d'information
      alert("La gestion multi-parcelles n'est pas encore disponible mais le sera bientôt !");
      return;
    }
    onToggle(false);
  };

  return (
    <fieldset className="fr-segmented fr-segmented--sm fr-mb-4w">
      <div className="fr-segmented__elements">
        <div className="fr-segmented__element">
          <input
            value="1"
            checked={!isMulti}
            type="radio"
            id="multiparcelle-map-simple"
            name="multiparcelle-map"
            onChange={() => handleChange("1")}
          />
          <label className="fr-icon-home-4-fill fr-label" htmlFor="multiparcelle-map-simple">
            Une parcelle
          </label>
        </div>
        <div className="fr-segmented__element">
          <input
            value="2"
            checked={isMulti}
            type="radio"
            id="multiparcelle-map-multi"
            name="multiparcelle-map"
            onChange={() => handleChange("2")}
          />
          <label className="fr-icon-community-fill fr-label" htmlFor="multiparcelle-map-multi">
            Plusieurs parcelles
          </label>
        </div>
      </div>
    </fieldset>
  );
}
