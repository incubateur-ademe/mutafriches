import { INTEGRATORS } from "../../../../context";

interface ConfigPanelProps {
  integrator: string;
  callbackUrl: string;
  callbackLabel: string;
  iframeUrl: string;
  showIframe: boolean;
  onIntegratorChange: (value: string) => void;
  onCallbackUrlChange: (value: string) => void;
  onCallbackLabelChange: (value: string) => void;
  onCopyUrl: () => void;
  onLoadIframe: () => void;
  onReloadIframe: () => void;
  onCloseIframe: () => void;
}

export function ConfigPanel({
  integrator,
  callbackUrl,
  callbackLabel,
  iframeUrl,
  showIframe,
  onIntegratorChange,
  onCallbackUrlChange,
  onCallbackLabelChange,
  onCopyUrl,
  onLoadIframe,
  onReloadIframe,
  onCloseIframe,
}: ConfigPanelProps) {
  return (
    <div className="fr-card fr-py-4w">
      <div className="fr-card__body">
        <h2 className="fr-h4">Configuration de l'intégration</h2>

        <div className="fr-grid-row fr-grid-row--gutters">
          {/* Colonne 1 : Intégrateur */}
          <div className="fr-col-12 fr-col-md-4">
            <div className="fr-select-group">
              <label className="fr-label" htmlFor="integrator-select">
                Intégrateur
              </label>
              <select
                className="fr-select"
                id="integrator-select"
                value={integrator}
                onChange={(e) => onIntegratorChange(e.target.value)}
                disabled={showIframe}
              >
                {Object.entries(INTEGRATORS).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Colonne 2 : URL de callback */}
          <div className="fr-col-12 fr-col-md-4">
            <div className="fr-input-group">
              <label className="fr-label" htmlFor="callback-url">
                URL de callback
              </label>
              <input
                className="fr-input"
                type="url"
                id="callback-url"
                value={callbackUrl}
                onChange={(e) => onCallbackUrlChange(e.target.value)}
                disabled={showIframe}
              />
            </div>
          </div>

          {/* Colonne 3 : Label du bouton */}
          <div className="fr-col-12 fr-col-md-4">
            <div className="fr-input-group">
              <label className="fr-label" htmlFor="callback-label">
                Label du bouton
              </label>
              <input
                className="fr-input"
                type="text"
                id="callback-label"
                value={callbackLabel}
                onChange={(e) => onCallbackLabelChange(e.target.value)}
                disabled={showIframe}
              />
            </div>
          </div>
        </div>

        {/* URL générée et actions */}
        <div className="fr-mt-3w">
          <div className="fr-alert fr-alert--info fr-alert--sm">
            <p className="fr-alert__title">URL d'intégration</p>
            <code className="fr-text--xs" style={{ wordBreak: "break-all" }}>
              {iframeUrl}
            </code>
            <button
              className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-mt-2w"
              onClick={onCopyUrl}
              type="button"
            >
              Copier l'URL
            </button>
          </div>

          <div className="fr-btns-group fr-btns-group--center fr-mt-3w">
            {!showIframe ? (
              <button className="fr-btn fr-btn--lg" onClick={onLoadIframe} type="button">
                <span className="fr-icon-play-line fr-icon--sm" aria-hidden="true"></span>
                Charger l'iframe
              </button>
            ) : (
              <>
                <button className="fr-btn fr-btn--secondary" onClick={onReloadIframe} type="button">
                  <span className="fr-icon-refresh-line fr-icon--sm" aria-hidden="true"></span>
                  Recharger
                </button>
                <button className="fr-btn fr-btn--tertiary" onClick={onCloseIframe} type="button">
                  Fermer l'iframe
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
