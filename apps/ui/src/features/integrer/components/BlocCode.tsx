interface BlocCodeProps {
  /** Titre court affiché au-dessus du bloc (« Requête », « Réponse »…) */
  titre?: string;
  children: string;
}

/** Extrait de code d'une page de documentation, défilable horizontalement sur petit écran. */
export function BlocCode({ titre, children }: BlocCodeProps) {
  return (
    <>
      {titre && <p className="fr-text--sm fr-text--bold fr-mb-1w fr-mt-2w">{titre}</p>}
      <div className="fr-highlight fr-ml-0">
        <pre style={{ overflowX: "auto" }}>
          <code>{children}</code>
        </pre>
      </div>
    </>
  );
}
