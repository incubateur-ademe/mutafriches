import React, { useState } from "react";

interface EnrichmentLoadingCalloutProps {
  title?: string;
}

const LOADING_MESSAGES = [
  "🏗️ Saviez-vous que 150 000 hectares de friches peuvent accueillir de nouveaux projets sans artificialiser les sols ?\nDécouvrons ensemble à quels usages votre site est le plus adapté.",
  "🌳 Replanter 1 milliard d'arbres d'ici 2032 est une priorité du gouvernement.\nDécouvrons ensemble si votre site est adapté à la renaturation.",
  "☀️ Multiplier par dix la production d'énergie photovoltaïque pour atteindre 42,8 TWh est une priorité du gouvernement.\nDécouvrons ensemble si votre site est adapté au photovoltaïque au sol.",
  "📡 Pour définir l'usage le plus adapté à la reconversion de votre site, nous recueillons un maximum d'informations localisées depuis plus de dix bases de données nationales.",
  "🗺️ Construire des projets plus durables commence par une bonne connaissance du terrain.\nDécouvrons ensemble quels sont les usages les plus adaptés sur votre site.",
];

const getRandomMessage = (): string => {
  const randomIndex = Math.floor(Math.random() * LOADING_MESSAGES.length);
  return LOADING_MESSAGES[randomIndex];
};

export const EnrichmentLoadingCallout: React.FC<EnrichmentLoadingCalloutProps> = ({
  title = "Enrichissement en cours...",
}) => {
  const [message] = useState<string>(getRandomMessage());

  return (
    <div className="fr-callout fr-callout--blue-cumulus fr-mt-4w fr-p-2w fade-in shimmer">
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ minHeight: "400px" }}
      >
        <img
          src="/illustrations/undraw_file-search_cbur.svg"
          alt="Illustration de recherche de fichier"
          width="200px"
          className="fr-mb-4w fr-mt-4w"
        />

        <h3 className="fr-h6 fr-mb-4w">{title}</h3>

        <blockquote className="mx-auto fr-px-4w" style={{ maxWidth: "800px" }}>
          <p
            className="fr-text--lead"
            style={{
              lineHeight: "1.8",
              whiteSpace: "pre-line",
              fontStyle: "italic",
            }}
          >
            {message}
          </p>
        </blockquote>
      </div>
    </div>
  );
};
