import React from "react";

interface LoadingCalloutProps {
  title: string;
  message?: string;
}

export const LoadingCallout: React.FC<LoadingCalloutProps> = ({ title, message }) => {
  return (
    <div className="fr-callout fr-callout--blue-france fr-mt-4w">
      <h3 className="fr-callout__title">
        <span className="fr-icon-refresh-fill" aria-hidden="true"></span>
        {title}
      </h3>
      {message && <p className="fr-callout__text">{message}</p>}
    </div>
  );
};
