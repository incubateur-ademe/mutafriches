interface LoadingCalloutProps {
  title?: string;
  message?: string;
}

export function LoadingCallout({
  title = "Enrichissement en cours",
  message = "Récupération des informations de la parcelle...",
}: LoadingCalloutProps) {
  return (
    <div className="fr-callout fr-callout--blue-france fr-mt-4w" style={{ marginBottom: "1rem" }}>
      <h3 className="fr-callout__title">
        <span
          className="fr-icon-refresh-fill"
          aria-hidden="true"
          style={{ marginRight: "0.5rem" }}
        />
        {title}
      </h3>
      <p className="fr-callout__text">{message}</p>
    </div>
  );
}
