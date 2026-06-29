import React, { useEffect, useRef } from "react";
import { ZCAL_CONFIG } from "../../config/zcal.config";

interface ZcalEmbedProps {
  /** Activer le rendu : le script n'est chargé que quand l'embed est visible (ex. modale ouverte) */
  active: boolean;
}

/**
 * Embed ZCal officiel (version JavaScript responsive). Le script transforme l'ancre
 * `.zcal-inline-widget` en iframe auto-dimensionnée à la hauteur réelle du contenu,
 * contrairement à un iframe statique qui tronquait le calendrier.
 *
 * Le script re-scanne les ancres dès qu'il s'exécute : on (ré)injecte le script à
 * chaque activation pour gérer le montage tardif dans une modale.
 */
export const ZcalEmbed: React.FC<ZcalEmbedProps> = ({ active }) => {
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const script = document.createElement("script");
    script.src = ZCAL_CONFIG.embedScriptUrl;
    script.async = true;
    document.body.appendChild(script);
    scriptRef.current = script;

    return () => {
      script.remove();
      scriptRef.current = null;
    };
  }, [active]);

  // Le script lit l'URL sur le premier enfant (`firstElementChild`) du conteneur
  // `.zcal-inline-widget` : l'ancre doit donc être imbriquée, pas porter la classe.
  return (
    <div className="zcal-inline-widget">
      <a href={ZCAL_CONFIG.bookingUrl}>Choisir un créneau avec l'équipe Mutafriches</a>
    </div>
  );
};
