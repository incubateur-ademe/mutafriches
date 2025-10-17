import { InputFormFields } from "./InputFormFields";

type Mode = "test-case" | "manual";
type InputMode = "locked" | "editable";

interface InputDataPanelProps {
  mode: Mode;
  inputMode: InputMode;
  formData: any;
  onFormDataChange: (data: any) => void;
  onInputModeChange: (mode: InputMode) => void;
  onCalculate: () => void;
  isCalculating: boolean;
  hasData: boolean;
}

export function InputDataPanel({
  mode,
  inputMode,
  formData,
  onFormDataChange,
  onInputModeChange,
  onCalculate,
  isCalculating,
  hasData,
}: InputDataPanelProps) {
  const isEditable = mode === "manual" || inputMode === "editable";

  return (
    <div className="fr-card fr-py-4w">
      <div className="fr-card__body">
        <div className="fr-grid-row fr-grid-row--middle fr-mb-3w">
          <div className="fr-col">
            <h2 className="fr-h5 fr-mb-0">Données d'entrée</h2>
          </div>
          {mode === "test-case" && hasData && (
            <div className="fr-col-auto">
              <fieldset className="fr-segmented">
                <div className="fr-segmented__elements">
                  <div className="fr-segmented__element">
                    <input
                      id="input-locked"
                      type="radio"
                      name="input-mode"
                      value="locked"
                      checked={inputMode === "locked"}
                      onChange={() => onInputModeChange("locked")}
                    />
                    <label className="fr-label" htmlFor="input-locked">
                      Verrouillé
                    </label>
                  </div>

                  <div className="fr-segmented__element">
                    <input
                      id="input-editable"
                      type="radio"
                      name="input-mode"
                      value="editable"
                      checked={inputMode === "editable"}
                      onChange={() => onInputModeChange("editable")}
                    />
                    <label className="fr-label" htmlFor="input-editable">
                      Modifiable
                    </label>
                  </div>
                </div>
              </fieldset>
            </div>
          )}
        </div>

        {!hasData ? (
          <div className="fr-alert fr-alert--info">
            <p className="fr-alert__title">Aucune donnée</p>
            <p>
              {mode === "test-case"
                ? "Sélectionnez un cas de test dans la liste ci-dessus"
                : "Remplissez le formulaire pour tester l'algorithme"}
            </p>
          </div>
        ) : (
          <>
            {/* Indicateur du mode actuel */}
            <div className="fr-mb-3w">
              {!isEditable && (
                <div className="fr-badge fr-badge--info">
                  Données verrouillées - Activez le mode modifiable pour éditer
                </div>
              )}
              {isEditable && mode === "test-case" && (
                <div className="fr-badge fr-badge--warning">
                  Mode édition - Les données peuvent différer du cas de test original
                </div>
              )}
            </div>

            {/* Formulaire des données */}
            <div className="fr-mb-3w fr-py-2w">
              <InputFormFields
                formData={formData}
                onFormDataChange={onFormDataChange}
                isEditable={isEditable}
              />
            </div>

            {/* Bouton de calcul */}
            <div className="fr-btns-group">
              <button
                className="fr-btn fr-btn--primary"
                onClick={onCalculate}
                disabled={isCalculating || !formData.surfaceSite}
              >
                {isCalculating ? "Calcul en cours..." : "Calculer la mutabilité"}
              </button>
            </div>

            {!formData.surfaceSite && (
              <p className="fr-error-text fr-mt-1w">
                La surface du site est obligatoire pour lancer le calcul
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
