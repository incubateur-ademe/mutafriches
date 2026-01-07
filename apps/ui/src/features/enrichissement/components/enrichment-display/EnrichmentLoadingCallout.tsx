import React, { useState } from "react";

interface EnrichmentLoadingCalloutProps {
  title?: string;
  subtitle?: string;
}

const LOADING_MESSAGES = [
  "🏗️ Saviez-vous que <strong>150 000 hectares de friches</strong> peuvent accueillir de nouveaux projets sans artificialiser les sols ?\nDécouvrons ensemble à quels usages votre site est le plus adapté.",
  "🌳 Replanter 1 milliard d'arbres d'ici 2032 est <strong>une priorité du gouvernement.</strong>\nDécouvrons ensemble si votre site est adapté à la renaturation.",
  "☀️ <strong>Multiplier par dix la production d'énergie photovoltaïque</strong> pour atteindre 42,8 TWh est une priorité du gouvernement.\nDécouvrons ensemble si votre site est adapté au photovoltaïque au sol.",
  "📡 Pour définir l'usage le plus adapté à la reconversion de votre site, nous recueillons un maximum d'informations localisées depuis plus de <strong>dix bases de données nationales.</strong>",
  "🗺️ Construire des projets plus durables commence par <strong>une bonne connaissance du terrain.</strong>\nDécouvrons ensemble quels sont les usages les plus adaptés sur votre site.",
];

const getRandomMessage = (): string => {
  const randomIndex = Math.floor(Math.random() * LOADING_MESSAGES.length);
  return LOADING_MESSAGES[randomIndex];
};

export const EnrichmentLoadingCallout: React.FC<EnrichmentLoadingCalloutProps> = ({
  title = "Qualification automatique de la parcelle en cours...",
  subtitle = "Cela peut prendre quelques secondes. ",
}) => {
  const [message] = useState<string>(getRandomMessage());

  return (
    <div className="fr-callout fr-callout--blue-cumulus fade-in shimmer">
      <div className="flex flex-col items-center justify-center text-center">
        <p className="fr-h4">{title}</p>
        <p className="fr-mb-4w">{subtitle}</p>

        <blockquote className="mx-auto fr-px-4w" style={{ maxWidth: "800px" }}>
          <p dangerouslySetInnerHTML={{ __html: message.replace(/\n/g, "<br />") }} />
        </blockquote>
      </div>
    </div>
  );
};
