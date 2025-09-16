import { useState, useEffect, useRef } from "react";
import { Layout } from "../../layouts";
import { Link } from "react-router-dom";
import { ConfigPanel } from "../../components/tests/iframeTest/ConfigPanel";
import { MessageConsole } from "../../components/tests/iframeTest/MessageConsole";
import { IframeViewer } from "../../components/tests/iframeTest/IframeViewer";

interface MessageLog {
  id: number;
  type: string;
  data: unknown;
  timestamp: Date;
}

export function TestIframe() {
  // États pour la configuration
  const [integrator, setIntegrator] = useState<string>("mutafriches");
  const [callbackUrl, setCallbackUrl] = useState<string>(
    "https://mutafriches.beta.gouv.fr/test/callback",
  );
  const [callbackLabel, setCallbackLabel] = useState<string>("Aller vers la page de callback");
  const [iframeUrl, setIframeUrl] = useState<string>("");
  const [showIframe, setShowIframe] = useState<boolean>(false);

  // États pour les messages
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false);

  // Référence pour l'iframe
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Mettre à jour l'URL quand les paramètres changent
  useEffect(() => {
    const buildIframeUrl = () => {
      const baseUrl = window.location.origin;
      const params = new URLSearchParams({
        integrator,
        callbackUrl,
        callbackLabel,
      });
      return `${baseUrl}?${params.toString()}`;
    };

    setIframeUrl(buildIframeUrl());
  }, [integrator, callbackUrl, callbackLabel]);

  // Écouter les messages de l'iframe
  useEffect(() => {
    if (!isListening) return;

    const handleMessage = (event: MessageEvent) => {
      // Vérifier l'origine pour la sécurité
      if (event.origin !== window.location.origin) {
        console.warn("Message reçu d'une origine non autorisée:", event.origin);
        return;
      }

      // Vérifier que c'est un message Mutafriches
      if (event.data?.type?.startsWith("mutafriches:")) {
        const newMessage: MessageLog = {
          id: Date.now() + Math.random(), // Ajout de random pour éviter les doublons
          type: event.data.type,
          data: event.data.data,
          timestamp: new Date(event.data.timestamp || Date.now()),
        };

        setMessages((prev) => [...prev, newMessage]);

        // Log en console aussi
        console.log("Message reçu de l'iframe:", event.data);

        // Notification visuelle pour les messages importants
        if (event.data.type === "mutafriches:completed") {
          console.log("✅ Formulaire complété avec succès !");
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [isListening]);

  // Handlers
  const handleLoadIframe = () => {
    setShowIframe(true);
    setIsListening(true);
    setMessages([]);
  };

  const handleReloadIframe = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeUrl;
      setMessages([]);
    }
  };

  const handleCloseIframe = () => {
    setShowIframe(false);
    setIsListening(false);
    setMessages([]);
  };

  const handleClearMessages = () => {
    setMessages([]);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(iframeUrl);
      // Vous pourriez ajouter une notification toast ici
      alert("URL copiée dans le presse-papier !");
    } catch (err) {
      console.error("Erreur lors de la copie:", err);
      alert("Impossible de copier l'URL");
    }
  };

  return (
    <Layout>
      <div className="fr-container fr-my-6w">
        {/* Breadcrumb */}
        <nav role="navigation" className="fr-breadcrumb" aria-label="vous êtes ici :">
          <button
            type="button"
            className="fr-breadcrumb__button"
            aria-expanded="false"
            aria-controls="breadcrumb-test"
          >
            Voir le Fil d'Ariane
          </button>
          <div className="fr-collapse" id="breadcrumb-test">
            <ol className="fr-breadcrumb__list">
              <li>
                <Link className="fr-breadcrumb__link" to="/">
                  Accueil
                </Link>
              </li>
              <li>
                <Link className="fr-breadcrumb__link" to="/tests">
                  Tests
                </Link>
              </li>
              <li>
                <a className="fr-breadcrumb__link" aria-current="page">
                  Test intégration Iframe
                </a>
              </li>
            </ol>
          </div>
        </nav>

        {/* Header */}
        <div className="fr-mb-4w">
          <h1>Test d'intégration iframe</h1>
          <p className="fr-text--lg">
            Simulez l'intégration du formulaire Mutafriches dans un site externe.
          </p>
        </div>

        {/* Configuration Panel - Toujours visible en haut */}
        <div className="fr-mb-4w">
          <ConfigPanel
            integrator={integrator}
            callbackUrl={callbackUrl}
            callbackLabel={callbackLabel}
            iframeUrl={iframeUrl}
            showIframe={showIframe}
            onIntegratorChange={setIntegrator}
            onCallbackUrlChange={setCallbackUrl}
            onCallbackLabelChange={setCallbackLabel}
            onCopyUrl={handleCopyUrl}
            onLoadIframe={handleLoadIframe}
            onReloadIframe={handleReloadIframe}
            onCloseIframe={handleCloseIframe}
          />
        </div>

        {/* Console des messages - Visible quand iframe chargée */}
        {showIframe && (
          <div className="fr-mb-4w">
            <MessageConsole
              messages={messages}
              isListening={isListening}
              onClear={handleClearMessages}
            />
          </div>
        )}

        {/* Iframe Viewer - Prend toute la largeur */}
        <IframeViewer iframeRef={iframeRef} iframeUrl={iframeUrl} showIframe={showIframe} />

        {/* Info supplémentaire en bas */}
        {showIframe && (
          <div className="fr-mt-4w fr-mb-10w">
            <div className="fr-alert fr-p-2 fr-alert--info fr-alert--sm">
              <p className="fr-alert__title">Information Utile</p>
              <p className="fr-text--sm fr-mb-2v">
                Ouvrez la console du navigateur (F12) pour voir les logs détaillés des messages
                échangés.
              </p>
              <p className="fr-text--sm fr-mb-0">
                Les messages sont envoyés via l'API postMessage entre l'iframe et cette page parent.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
