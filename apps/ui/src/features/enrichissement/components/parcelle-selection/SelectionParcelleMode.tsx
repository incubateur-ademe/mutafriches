import React from "react";

interface SelectionParcelleModeProps {
  mode: "id" | "carte";
  onChange: (mode: "id" | "carte") => void;
}

export const SelectionParcelleMode: React.FC<SelectionParcelleModeProps> = ({ mode, onChange }) => {
  return (
    <fieldset className="fr-segmented fr-mb-4w">
      <div className="fr-segmented__elements">
        <div className="fr-segmented__element">
          <input
            value="id"
            type="radio"
            id="mode-id"
            name="selection-mode"
            checked={mode === "id"}
            onChange={() => onChange("id")}
          />
          <label className="fr-icon-edit-line fr-label" htmlFor="mode-id">
            Par identifiant de parcelle
          </label>
        </div>
        <div className="fr-segmented__element">
          <input
            value="carte"
            type="radio"
            id="mode-carte"
            name="selection-mode"
            checked={mode === "carte"}
            onChange={() => onChange("carte")}
          />
          <label className="fr-icon-map-pin-2-line fr-label" htmlFor="mode-carte">
            Depuis la carte
          </label>
        </div>
      </div>
    </fieldset>
  );
};
