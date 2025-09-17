import { RefObject } from "react";

interface IframeViewerProps {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  iframeUrl: string;
  showIframe: boolean;
}

export function IframeViewer({ iframeRef, iframeUrl, showIframe }: IframeViewerProps) {
  if (!showIframe) {
    return (
      <div className="fr-callout fr-callout--blue-ecume">
        <h3 className="fr-callout__title">Mode d'emploi</h3>

        <div className="fr-grid-row fr-grid-row--gutters fr-mb-3w">
          <div className="fr-col-12 fr-col-md-6">
            <h4 className="fr-h6">Comment tester ?</h4>
            <ol className="fr-text--sm">
              <li>Configurez les paramètres ci-dessus</li>
              <li>Cliquez sur "Charger l'iframe"</li>
              <li>Remplissez le formulaire</li>
              <li>Observez les messages dans la console</li>
              <li>Testez le bouton de callback à l'étape 3</li>
            </ol>
          </div>

          <div className="fr-col-12 fr-col-md-6">
            <h4 className="fr-h6">Messages attendus</h4>
            <ul className="fr-text--sm">
              <li>
                <span className="fr-badge fr-badge--success fr-badge--sm">completed</span>
                Formulaire terminé avec les résultats
              </li>
              <li>
                <span className="fr-badge fr-badge--error fr-badge--sm">error</span>
                Une erreur s'est produite
              </li>
            </ul>
          </div>
        </div>

        <div className="fr-notice fr-notice--info">
          <div className="fr-container">
            <div className="fr-notice__body">
              <p className="fr-notice__title">
                Cette page simule exactement ce que ferait un site intégrateur.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#f5f5fe",
        padding: "2rem",
        borderRadius: "0.5rem",
        border: "2px dashed var(--border-action-high-blue-france)",
      }}
    >
      <div className="fr-mb-2w" style={{ textAlign: "center" }}>
        <span className="fr-badge fr-badge--blue-ecume">
          Iframe Mutafriches en cours d'exécution
        </span>
      </div>

      <iframe
        ref={iframeRef}
        src={iframeUrl}
        style={{
          width: "100%",
          height: "900px",
          border: "1px solid var(--border-default-grey)",
          borderRadius: "0.25rem",
          backgroundColor: "white",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
        title="Mutafriches Integration Test"
      />
    </div>
  );
}
