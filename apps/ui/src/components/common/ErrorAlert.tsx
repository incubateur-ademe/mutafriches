interface ErrorAlertProps {
  message: string;
  onClose?: () => void;
  type?: "error" | "warning" | "info";
  title?: string;
  suggestions?: string[];
}

export function ErrorAlert({
  message,
  onClose,
  type = "error",
  title,
  suggestions,
}: ErrorAlertProps) {
  // Déterminer le titre selon le type d'erreur
  const getTitle = () => {
    if (title) return title;

    // Analyser le message pour proposer un titre contextuel
    if (
      message.toLowerCase().includes("introuvable") ||
      message.toLowerCase().includes("non trouvé")
    ) {
      return "Parcelle introuvable";
    }
    if (message.toLowerCase().includes("invalide") || message.toLowerCase().includes("incorrect")) {
      return "Données invalides";
    }
    if (message.toLowerCase().includes("connexion") || message.toLowerCase().includes("serveur")) {
      return "Problème de connexion";
    }
    return "Erreur";
  };

  // Proposer des suggestions selon le type d'erreur
  const getSuggestions = () => {
    if (suggestions) return suggestions;

    const defaultSuggestions: string[] = [];

    if (message.toLowerCase().includes("cadastrales introuvables")) {
      // TODO message dans packages/shared ?
      defaultSuggestions.push(
        "Vérifiez que l'identifiant de parcelle est correct",
        "Format attendu : code commune (5-6 caractères) + préfixe (0-3 caractères) + section (1-2 lettres majuscules) + numéro (4 chiffres). ",
        "Exemples : 25056000IK0102 ou 972090000O0498",
      );
    } else if (message.toLowerCase().includes("connexion")) {
      defaultSuggestions.push(
        "Vérifiez votre connexion Internet",
        "Réessayez dans quelques instants",
      );
    }

    return defaultSuggestions;
  };

  const alertClass = `fr-alert fr-alert--${type} fr-mt-4w`;
  const finalTitle = getTitle();
  const finalSuggestions = getSuggestions();

  return (
    <div className={alertClass} style={{ marginBottom: "1rem" }}>
      <h3 className="fr-alert__title">{finalTitle}</h3>
      <p>{message}</p>

      {finalSuggestions.length > 0 && (
        <div className="fr-mt-2w">
          <p className="fr-text--sm fr-mb-1w">
            <strong>Suggestions :</strong>
          </p>
          <ul className="fr-text--sm">
            {finalSuggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

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
