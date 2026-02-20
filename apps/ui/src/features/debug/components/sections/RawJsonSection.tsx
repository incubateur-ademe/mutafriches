import React, { useState } from "react";
import { EnrichissementOutputDto, MutabiliteOutputDto } from "@mutafriches/shared-types";

interface RawJsonSectionProps {
  enrichmentData?: EnrichissementOutputDto;
  mutabilityData: MutabiliteOutputDto | null;
}

/** Composant interne pour un bloc JSON avec bouton copier */
const JsonBlock: React.FC<{ label: string; data: unknown }> = ({ label, data }) => {
  const [copied, setCopied] = useState(false);
  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silencieux si l'API Clipboard n'est pas disponible
    }
  };

  return (
    <details style={{ marginTop: "0.5rem" }}>
      <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.8125rem" }}>
        {label}
      </summary>
      <button
        type="button"
        className="fr-btn fr-btn--sm fr-btn--tertiary debug-panel__copy-btn"
        onClick={handleCopy}
      >
        {copied ? "Copi\u00E9 !" : "Copier le JSON"}
      </button>
      <pre className="debug-panel__json">{jsonString}</pre>
    </details>
  );
};

export const RawJsonSection: React.FC<RawJsonSectionProps> = ({
  enrichmentData,
  mutabilityData,
}) => {
  return (
    <details className="debug-panel__section">
      <summary>JSON brut</summary>
      <div className="debug-panel__section-content">
        {enrichmentData && <JsonBlock label="Données d'enrichissement" data={enrichmentData} />}
        {mutabilityData && <JsonBlock label="Résultats d'évaluation" data={mutabilityData} />}
        {!enrichmentData && !mutabilityData && (
          <p className="fr-text--sm">Aucune donnée JSON disponible.</p>
        )}
      </div>
    </details>
  );
};
