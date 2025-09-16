import { IframeMessageType } from "../../../utils/iframe/iframeCommunication";

interface MessageLog {
  id: number;
  type: string;
  data: unknown;
  timestamp: Date;
}

interface MessageConsoleProps {
  messages: MessageLog[];
  isListening: boolean;
  onClear: () => void;
}

export function MessageConsole({ messages, isListening, onClear }: MessageConsoleProps) {
  const getMessageBadgeClass = (type: string) => {
    switch (type) {
      case IframeMessageType.COMPLETED:
        return "success";
      case IframeMessageType.ERROR:
        return "error";
      default:
        return "new";
    }
  };

  const formatMessage = (msg: MessageLog) => {
    return JSON.stringify(msg.data, null, 2);
  };

  return (
    <div className="fr-card fr-py-4w">
      <div className="fr-card__body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 className="fr-h5 fr-mb-4">
            Console des messages ({messages.length})
            {isListening && (
              <span className="fr-badge fr-badge--success fr-badge--sm fr-ml-2w">
                Écoute active
              </span>
            )}
          </h3>
          {messages.length > 0 && (
            <button
              className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm"
              onClick={onClear}
              type="button"
            >
              Effacer tout
            </button>
          )}
        </div>

        <div
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            border: "1px solid var(--border-default-grey)",
            borderRadius: "0.25rem",
            padding: "1rem",
            backgroundColor: "#f9f9f9",
          }}
        >
          {messages.length === 0 ? (
            <p className="fr-text--sm fr-text--alt fr-mb-0">
              {isListening
                ? "En attente de messages..."
                : "Chargez l'iframe pour commencer à écouter les messages"}
            </p>
          ) : (
            <div className="fr-accordions-group">
              {messages.map((msg) => (
                <section key={msg.id} className="fr-accordion">
                  <h4 className="fr-accordion__title">
                    <button
                      className="fr-accordion__btn"
                      aria-expanded="false"
                      aria-controls={`msg-${msg.id}`}
                      style={{ fontSize: "0.875rem", padding: "0.75rem" }}
                    >
                      <span
                        className={`fr-badge fr-badge--${getMessageBadgeClass(msg.type)} fr-badge--sm fr-mr-2w`}
                      >
                        {msg.type.replace("mutafriches:", "")}
                      </span>
                      <span className="fr-text--sm">
                        {msg.timestamp.toLocaleTimeString("fr-FR")}
                      </span>
                    </button>
                  </h4>
                  <div className="fr-collapse" id={`msg-${msg.id}`}>
                    <pre
                      style={{
                        backgroundColor: "white",
                        padding: "1rem",
                        borderRadius: "0.25rem",
                        overflow: "auto",
                        fontSize: "0.75rem",
                        border: "1px solid #e5e5e5",
                        margin: "0.5rem",
                      }}
                    >
                      {formatMessage(msg)}
                    </pre>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
