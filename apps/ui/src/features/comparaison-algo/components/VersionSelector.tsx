import React from "react";
import type { AlgorithmeVersionDto } from "@mutafriches/shared-types";

interface VersionSelectorProps {
  versions: AlgorithmeVersionDto[];
  selectedVersions: string[];
  onToggleVersion: (version: string) => void;
  isLoading?: boolean;
}

export const VersionSelector: React.FC<VersionSelectorProps> = ({
  versions,
  selectedVersions,
  onToggleVersion,
  isLoading = false,
}) => {
  return (
    <fieldset
      className="fr-fieldset"
      id="comparaison-versions"
      aria-labelledby="comparaison-versions-legend comparaison-versions-messages"
      disabled={isLoading}
    >
      <legend
        className="fr-fieldset__legend--regular fr-fieldset__legend"
        id="comparaison-versions-legend"
      >
        Versions à comparer
        <span className="fr-hint-text">
          Sélectionnez au moins 2 versions pour lancer la comparaison
        </span>
      </legend>
      {versions.map((v) => {
        const inputId = `checkbox-version-${v.version}`;
        const messagesId = `${inputId}-messages`;
        return (
          <div className="fr-fieldset__element" key={v.version}>
            <div className="fr-checkbox-group">
              <input
                name={`version-${v.version}`}
                id={inputId}
                type="checkbox"
                aria-describedby={messagesId}
                checked={selectedVersions.includes(v.version)}
                onChange={() => onToggleVersion(v.version)}
              />
              <label className="fr-label" htmlFor={inputId}>
                {v.version} - {v.label}
                <span className="fr-hint-text">{v.date}</span>
              </label>
              <div className="fr-messages-group" id={messagesId} aria-live="polite" />
            </div>
          </div>
        );
      })}
      <div className="fr-messages-group" id="comparaison-versions-messages" aria-live="polite" />
    </fieldset>
  );
};
