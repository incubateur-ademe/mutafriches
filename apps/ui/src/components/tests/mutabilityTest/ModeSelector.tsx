type Mode = "test-case" | "manual";

interface ModeSelectorProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <fieldset className="fr-segmented">
      <div className="fr-segmented__elements">
        <div className="fr-segmented__element">
          <input
            value="test-case"
            checked={mode === "test-case"}
            type="radio"
            id="mode-test-case"
            name="test-mode"
            onChange={() => onModeChange("test-case")}
          />
          <label className="fr-label" htmlFor="mode-test-case">
            Cas de test prédéfini
          </label>
        </div>

        <div className="fr-segmented__element">
          <input
            value="manual"
            checked={mode === "manual"}
            type="radio"
            id="mode-manual"
            name="test-mode"
            onChange={() => onModeChange("manual")}
          />
          <label className="fr-label" htmlFor="mode-manual">
            Saisie manuelle
          </label>
        </div>
      </div>
    </fieldset>
  );
}
