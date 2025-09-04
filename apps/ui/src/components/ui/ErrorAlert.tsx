interface ErrorAlertProps {
  message: string;
  onClose?: () => void;
}

export function ErrorAlert({ message, onClose }: ErrorAlertProps) {
  return (
    <div className="fr-alert fr-alert--error fr-mt-4w" style={{ marginBottom: "1rem" }}>
      <h3 className="fr-alert__title">Erreur</h3>
      <p>{message}</p>
      {onClose && (
        <button
          className="fr-btn--close fr-btn"
          title="Masquer le message"
          onClick={onClose}
          aria-label="Fermer"
        >
          Fermer
        </button>
      )}
    </div>
  );
}
