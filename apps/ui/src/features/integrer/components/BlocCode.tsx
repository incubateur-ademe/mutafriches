import { useState } from "react";

interface BlocCodeProps {
  /** Titre court affiché au-dessus du bloc (« Requête », « Réponse »…) */
  titre?: string;
  children: string;
}

const DUREE_CONFIRMATION_MS = 2000;

/** Extrait de code copiable d'une page de documentation, défilable horizontalement. */
export function BlocCode({ titre, children }: BlocCodeProps) {
  const [copie, setCopie] = useState(false);

  const copier = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(children);
      setCopie(true);
      setTimeout(() => setCopie(false), DUREE_CONFIRMATION_MS);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé) : le texte reste sélectionnable
    }
  };

  return (
    <div className="fr-mb-2w">
      <div className="flex items-center justify-between fr-mt-2w">
        <p className="fr-text--sm fr-text--bold fr-mb-0">{titre}</p>
        <button
          type="button"
          className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-clipboard-line fr-btn--icon-left"
          onClick={() => void copier()}
        >
          <span aria-live="polite">{copie ? "Copié" : "Copier"}</span>
        </button>
      </div>
      <pre className="fr-background-alt--grey fr-p-2w fr-m-0 fr-text--sm overflow-x-auto">
        <code>{children}</code>
      </pre>
    </div>
  );
}
